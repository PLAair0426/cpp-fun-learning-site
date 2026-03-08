param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectRoot,

    [string]$Profile,
    [string]$ConfigFile,
    [string[]]$IncludeGlobs,
    [string[]]$ExcludeGlobs,
    [switch]$DryRun,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDirectory "template-utils.ps1")

$templateRoot = Split-Path -Parent $scriptDirectory
$repoRoot = Split-Path -Parent $templateRoot
$manifestPath = Join-Path $templateRoot "template-manifest.json"
$manifest = Read-JsonAsHashtable -Path $manifestPath

$resolvedProjectRoot = Get-AbsolutePath -PathValue $ProjectRoot -BasePath (Get-Location).Path
if (-not (Test-Path $resolvedProjectRoot)) {
    throw "ProjectRoot not found: $resolvedProjectRoot"
}

$statePath = Join-Path $resolvedProjectRoot ".template/template-state.json"
$state = Read-JsonAsHashtable -Path $statePath

$configPath = Resolve-PathCandidate -PathValue $ConfigFile -SearchRoots @((Get-Location).Path, $resolvedProjectRoot, $repoRoot)
$projectConfig = Remove-UnresolvedTemplateTokens -InputObject (Read-JsonAsHashtable -Path $configPath)

$selectedProfile = $Profile
if ([string]::IsNullOrWhiteSpace($selectedProfile)) {
    $selectedProfile = [string](Get-ConfigValue -Config $projectConfig -Path @('project', 'profile') -Default $null)
}
if ([string]::IsNullOrWhiteSpace($selectedProfile)) {
    $selectedProfile = [string](Get-ConfigValue -Config $state -Path @('profile') -Default $null)
}
if ([string]::IsNullOrWhiteSpace($selectedProfile)) {
    $selectedProfile = [string](Get-ConfigValue -Config $manifest -Path @('defaultProfile') -Default 'web-product')
}

$profilePath = Join-Path $templateRoot ("profiles/{0}.json" -f $selectedProfile)
if (-not (Test-Path $profilePath)) {
    throw "Profile not found: $selectedProfile"
}
$profileConfig = Read-JsonAsHashtable -Path $profilePath

$resolvedProjectName = [string](Get-ConfigValue -Config $projectConfig -Path @('project', 'name') -Default $null)
if ([string]::IsNullOrWhiteSpace($resolvedProjectName)) {
    $resolvedProjectName = [string](Get-ConfigValue -Config $state -Path @('project', 'name') -Default (Split-Path -Leaf $resolvedProjectRoot))
}

$resolvedProjectSlug = [string](Get-ConfigValue -Config $projectConfig -Path @('project', 'slug') -Default $null)
if ([string]::IsNullOrWhiteSpace($resolvedProjectSlug)) {
    $resolvedProjectSlug = [string](Get-ConfigValue -Config $state -Path @('project', 'slug') -Default (Split-Path -Leaf $resolvedProjectRoot))
}
$resolvedProjectSlug = Resolve-ProjectSlug -ProjectName $resolvedProjectName -ProjectSlug $resolvedProjectSlug

$scaffoldPlan = New-ScaffoldPlan -Manifest $manifest -ProfileConfig $profileConfig -ProjectConfig $projectConfig
$scaffoldPlan['directories'] = Merge-UniqueArray -Left (Get-ConfigArray -Config $state -Path @('scaffold', 'directories')) -Right $scaffoldPlan['directories']
$scaffoldPlan['includeGlobs'] = Merge-UniqueArray -Left (Get-ConfigArray -Config $state -Path @('scaffold', 'includeGlobs')) -Right $scaffoldPlan['includeGlobs']
$scaffoldPlan['excludeGlobs'] = Merge-UniqueArray -Left (Get-ConfigArray -Config $state -Path @('scaffold', 'excludeGlobs')) -Right $scaffoldPlan['excludeGlobs']
$scaffoldPlan['managedGlobs'] = Merge-UniqueArray -Left (Get-ConfigArray -Config $state -Path @('scaffold', 'managedGlobs')) -Right $scaffoldPlan['managedGlobs']
$scaffoldPlan['protectedPrefixes'] = Merge-UniqueArray -Left (Get-ConfigArray -Config $state -Path @('scaffold', 'protectedPrefixes')) -Right $scaffoldPlan['protectedPrefixes']

$scaffoldPlan['managedGlobs'] = Merge-UniqueArray -Left $scaffoldPlan['managedGlobs'] -Right $IncludeGlobs
$scaffoldPlan['excludeGlobs'] = Merge-UniqueArray -Left $scaffoldPlan['excludeGlobs'] -Right $ExcludeGlobs

$variables = Merge-Hashtable -Base (Get-ConfigValue -Config $profileConfig -Path @('variables') -Default @{}) -Override (Get-ConfigValue -Config $state -Path @('variables') -Default @{})
$variables = Merge-Hashtable -Base $variables -Override (Get-ConfigValue -Config $projectConfig -Path @('variables') -Default @{})
$variables['PROJECT_NAME'] = $resolvedProjectName
$variables['PROJECT_SLUG'] = $resolvedProjectSlug
$variables['PROJECT_PROFILE'] = $selectedProfile
$variables['TEMPLATE_VERSION'] = [string](Get-ConfigValue -Config $manifest -Path @('templateVersion') -Default '1.0.0')

if (-not $variables.ContainsKey('PROJECT_TYPE')) {
    $variables['PROJECT_TYPE'] = $selectedProfile
}
if (-not $variables.ContainsKey('PRIMARY_STACK')) {
    $variables['PRIMARY_STACK'] = 'TBD'
}
if (-not $variables.ContainsKey('DEPLOYMENT_MODE')) {
    $variables['DEPLOYMENT_MODE'] = 'Docker'
}
if (-not $variables.ContainsKey('OWNER')) {
    $variables['OWNER'] = 'TBD'
}
if (-not $variables.ContainsKey('DEFAULT_LANGUAGE')) {
    $variables['DEFAULT_LANGUAGE'] = 'zh-CN'
}

foreach ($directory in $scaffoldPlan['directories']) {
    if (-not $DryRun) {
        New-Item -ItemType Directory -Force -Path (Join-Path $resolvedProjectRoot ($directory.Replace('/', '\'))) | Out-Null
    }
}

$managedFiles = Resolve-RelativeGlobs -RootPath $repoRoot -Patterns $scaffoldPlan['managedGlobs']
$managedFiles = $managedFiles | Where-Object { -not (Test-MatchesAnyPattern -RelativePath $_ -Patterns $scaffoldPlan['excludeGlobs']) }

$textExtensions = Get-ConfigArray -Config $manifest -Path @('textExtensions')
$report = @()
foreach ($relativePath in $managedFiles) {
    $isProtected = Test-MatchesAnyPattern -RelativePath $relativePath -Patterns $scaffoldPlan['protectedPrefixes']
    if ($isProtected -and -not $Force) {
        $report += [PSCustomObject]@{
            Path = $relativePath
            Action = "skip-protected"
        }
        continue
    }

    $action = Get-ManagedFileAction -SourceRoot $repoRoot -DestinationRoot $resolvedProjectRoot -RelativePath $relativePath -TextExtensions $textExtensions -Variables $variables
    $report += [PSCustomObject]@{
        Path = $relativePath
        Action = $action
    }

    if (-not $DryRun -and $action -ne 'unchanged') {
        Write-ManagedTemplateFile -SourceRoot $repoRoot -DestinationRoot $resolvedProjectRoot -RelativePath $relativePath -TextExtensions $textExtensions -Variables $variables
    }
}

$updatedState = @{
    templateVersion = $variables['TEMPLATE_VERSION']
    lastSyncedAt = (Get-Date).ToString('o')
    sourceTemplateRoot = $repoRoot
    profile = $selectedProfile
    project = @{
        name = $resolvedProjectName
        slug = $resolvedProjectSlug
    }
    variables = $variables
    scaffold = @{
        directories = $scaffoldPlan['directories']
        includeGlobs = $scaffoldPlan['includeGlobs']
        excludeGlobs = $scaffoldPlan['excludeGlobs']
        managedGlobs = $scaffoldPlan['managedGlobs']
        protectedPrefixes = $scaffoldPlan['protectedPrefixes']
    }
}

if (-not $DryRun) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $statePath) | Out-Null
    Write-Utf8File -Path $statePath -Content ($updatedState | ConvertTo-Json -Depth 32)
}

$creates = ($report | Where-Object { $_.Action -eq 'create' }).Count
$updates = ($report | Where-Object { $_.Action -eq 'update' }).Count
$unchanged = ($report | Where-Object { $_.Action -eq 'unchanged' }).Count
$skipped = ($report | Where-Object { $_.Action -eq 'skip-protected' }).Count

Write-Host ("Template sync {0} for {1}" -f ($(if ($DryRun) { 'preview' } else { 'completed' }), $resolvedProjectRoot))
Write-Host ("Profile: {0}" -f $selectedProfile)
Write-Host ("Create: {0} | Update: {1} | Unchanged: {2} | Skipped: {3}" -f $creates, $updates, $unchanged, $skipped)

foreach ($item in $report | Sort-Object Path) {
    Write-Host ("[{0}] {1}" -f $item.Action, $item.Path)
}
