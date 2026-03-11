param(
    [string]$ProjectName,
    [string]$ProjectSlug,

    [Parameter(Mandatory = $true)]
    [string]$TargetPath,

    [string]$Profile,
    [string]$ConfigFile,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $scriptDirectory "template-utils.ps1")

$templateRoot = Split-Path -Parent $scriptDirectory
$repoRoot = Split-Path -Parent $templateRoot
$manifestPath = Join-Path $templateRoot "template-manifest.json"

$manifest = Read-JsonAsHashtable -Path $manifestPath
$configPath = Resolve-PathCandidate -PathValue $ConfigFile -SearchRoots @((Get-Location).Path, $repoRoot)
$projectConfig = Remove-UnresolvedTemplateTokens -InputObject (Read-JsonAsHashtable -Path $configPath)

$selectedProfile = $Profile
if ([string]::IsNullOrWhiteSpace($selectedProfile)) {
    $selectedProfile = [string](Get-ConfigValue -Config $projectConfig -Path @('project', 'profile') -Default $null)
}
if ([string]::IsNullOrWhiteSpace($selectedProfile)) {
    $selectedProfile = [string](Get-ConfigValue -Config $manifest -Path @('defaultProfile') -Default 'web-product')
}

$profilePath = Join-Path $templateRoot ("profiles/{0}.json" -f $selectedProfile)
if (-not (Test-Path $profilePath)) {
    throw "Profile not found: $selectedProfile"
}
$profileConfig = Read-JsonAsHashtable -Path $profilePath

$resolvedProjectName = $ProjectName
if ([string]::IsNullOrWhiteSpace($resolvedProjectName)) {
    $resolvedProjectName = [string](Get-ConfigValue -Config $projectConfig -Path @('project', 'name') -Default $null)
}
if ([string]::IsNullOrWhiteSpace($resolvedProjectName)) {
    throw "ProjectName is required. Provide -ProjectName or set project.name in ConfigFile."
}

$requestedSlug = $ProjectSlug
if ([string]::IsNullOrWhiteSpace($requestedSlug)) {
    $requestedSlug = [string](Get-ConfigValue -Config $projectConfig -Path @('project', 'slug') -Default $null)
}
$resolvedProjectSlug = Resolve-ProjectSlug -ProjectName $resolvedProjectName -ProjectSlug $requestedSlug
if ([string]::IsNullOrWhiteSpace($resolvedProjectSlug)) {
    throw "ProjectSlug could not be resolved. Provide -ProjectSlug or a valid project.slug in ConfigFile."
}

$targetBasePath = Get-AbsolutePath -PathValue $TargetPath -BasePath (Get-Location).Path
New-Item -ItemType Directory -Force -Path $targetBasePath | Out-Null

$projectRoot = Join-Path $targetBasePath $resolvedProjectSlug
if ((Test-Path $projectRoot) -and -not $Force) {
    $existingItems = Get-ChildItem -Path $projectRoot -Force -ErrorAction SilentlyContinue
    if ($existingItems.Count -gt 0) {
        throw "Target project directory already exists and is not empty: $projectRoot. Use -Force to continue."
    }
}

$scaffoldPlan = New-ScaffoldPlan -Manifest $manifest -ProfileConfig $profileConfig -ProjectConfig $projectConfig

$variables = Merge-Hashtable -Base (Get-ConfigValue -Config $profileConfig -Path @('variables') -Default @{}) -Override (Get-ConfigValue -Config $projectConfig -Path @('variables') -Default @{})
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

New-Item -ItemType Directory -Force -Path $projectRoot | Out-Null
foreach ($directory in $scaffoldPlan['directories']) {
    New-Item -ItemType Directory -Force -Path (Join-Path $projectRoot ($directory.Replace('/', '\'))) | Out-Null
}

$scaffoldFiles = Resolve-RelativeGlobs -RootPath $repoRoot -Patterns $scaffoldPlan['includeGlobs']
$scaffoldFiles = $scaffoldFiles | Where-Object { -not (Test-MatchesAnyPattern -RelativePath $_ -Patterns $scaffoldPlan['excludeGlobs']) }

$textExtensions = Get-ConfigArray -Config $manifest -Path @('textExtensions')
foreach ($relativePath in $scaffoldFiles) {
    Write-ManagedTemplateFile -SourceRoot $repoRoot -DestinationRoot $projectRoot -RelativePath $relativePath -TextExtensions $textExtensions -Variables $variables
}

$state = @{
    templateVersion = $variables['TEMPLATE_VERSION']
    generatedAt = (Get-Date).ToString('o')
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

$statePath = Join-Path $projectRoot ".template/template-state.json"
Write-Utf8File -Path $statePath -Content ($state | ConvertTo-Json -Depth 32)

Write-Host ("Project template initialized at {0}" -f $projectRoot)
Write-Host ("Profile: {0}" -f $selectedProfile)
Write-Host ("Scaffold files copied: {0}" -f $scaffoldFiles.Count)
