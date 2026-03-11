function ConvertTo-Hashtable {
    param(
        [Parameter(ValueFromPipeline = $true)]
        $InputObject
    )

    if ($null -eq $InputObject) {
        return $null
    }

    if ($InputObject -is [System.Collections.IDictionary]) {
        $result = @{}
        foreach ($key in $InputObject.Keys) {
            $result[$key] = ConvertTo-Hashtable -InputObject $InputObject[$key]
        }
        return $result
    }

    if ($InputObject -is [System.Management.Automation.PSCustomObject]) {
        $result = @{}
        foreach ($property in $InputObject.PSObject.Properties) {
            $result[$property.Name] = ConvertTo-Hashtable -InputObject $property.Value
        }
        return $result
    }

    if (($InputObject -is [System.Collections.IEnumerable]) -and -not ($InputObject -is [string])) {
        $items = @()
        foreach ($item in $InputObject) {
            $items += , (ConvertTo-Hashtable -InputObject $item)
        }
        return $items
    }

    return $InputObject
}

function Read-JsonAsHashtable {
    param(
        [string]$Path
    )

    if ([string]::IsNullOrWhiteSpace($Path) -or -not (Test-Path $Path)) {
        return @{}
    }

    $raw = Get-Content -Path $Path -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return @{}
    }

    return ConvertTo-Hashtable -InputObject ($raw | ConvertFrom-Json)
}

function Remove-UnresolvedTemplateTokens {
    param(
        $InputObject
    )

    if ($null -eq $InputObject) {
        return $null
    }

    if ($InputObject -is [hashtable]) {
        $result = @{}
        foreach ($key in $InputObject.Keys) {
            $cleaned = Remove-UnresolvedTemplateTokens -InputObject $InputObject[$key]
            if ($null -ne $cleaned) {
                $result[$key] = $cleaned
            }
        }
        return $result
    }

    if (($InputObject -is [System.Collections.IEnumerable]) -and -not ($InputObject -is [string])) {
        $items = @()
        foreach ($item in $InputObject) {
            $cleaned = Remove-UnresolvedTemplateTokens -InputObject $item
            if ($null -ne $cleaned) {
                $items += , $cleaned
            }
        }
        return $items
    }

    if (($InputObject -is [string]) -and ($InputObject -match '^\{\{[A-Z0-9_]+\}\}$')) {
        return $null
    }

    return $InputObject
}

function Merge-UniqueArray {
    param(
        [AllowNull()]
        [object[]]$Left,
        [AllowNull()]
        [object[]]$Right
    )

    $result = @()
    foreach ($value in @($Left) + @($Right)) {
        if ($null -eq $value) {
            continue
        }

        $candidate = [string]$value
        if ([string]::IsNullOrWhiteSpace($candidate)) {
            continue
        }

        if ($result -notcontains $candidate) {
            $result += $candidate
        }
    }

    return $result
}

function Merge-Hashtable {
    param(
        [AllowNull()]
        [hashtable]$Base,
        [AllowNull()]
        [hashtable]$Override
    )

    $result = @{}

    if ($Base) {
        foreach ($key in $Base.Keys) {
            $result[$key] = $Base[$key]
        }
    }

    if (-not $Override) {
        return $result
    }

    foreach ($key in $Override.Keys) {
        $baseValue = $null
        if ($result.ContainsKey($key)) {
            $baseValue = $result[$key]
        }

        $overrideValue = $Override[$key]

        if (($baseValue -is [hashtable]) -and ($overrideValue -is [hashtable])) {
            $result[$key] = Merge-Hashtable -Base $baseValue -Override $overrideValue
            continue
        }

        if (($baseValue -is [System.Collections.IEnumerable]) -and -not ($baseValue -is [string]) `
            -and ($overrideValue -is [System.Collections.IEnumerable]) -and -not ($overrideValue -is [string])) {
            $result[$key] = Merge-UniqueArray -Left @($baseValue) -Right @($overrideValue)
            continue
        }

        $result[$key] = $overrideValue
    }

    return $result
}

function Get-ConfigValue {
    param(
        [hashtable]$Config,
        [string[]]$Path,
        $Default = $null
    )

    $current = $Config
    foreach ($segment in $Path) {
        if ($null -eq $current -or -not ($current -is [hashtable]) -or -not $current.ContainsKey($segment)) {
            return $Default
        }
        $current = $current[$segment]
    }

    if ($null -eq $current) {
        return $Default
    }

    return $current
}

function Get-ConfigArray {
    param(
        [hashtable]$Config,
        [string[]]$Path
    )

    $value = Get-ConfigValue -Config $Config -Path $Path -Default @()
    if ($null -eq $value) {
        return @()
    }

    if (($value -is [System.Collections.IEnumerable]) -and -not ($value -is [string])) {
        return @($value)
    }

    return @($value)
}

function Normalize-RelativePath {
    param(
        [string]$PathValue
    )

    if ([string]::IsNullOrWhiteSpace($PathValue)) {
        return ""
    }

    return $PathValue.Replace('\', '/').TrimStart('./').TrimStart('/')
}

function Resolve-PathCandidate {
    param(
        [string]$PathValue,
        [string[]]$SearchRoots
    )

    if ([string]::IsNullOrWhiteSpace($PathValue)) {
        return $null
    }

    if ([System.IO.Path]::IsPathRooted($PathValue)) {
        return [System.IO.Path]::GetFullPath($PathValue)
    }

    foreach ($root in $SearchRoots) {
        if ([string]::IsNullOrWhiteSpace($root)) {
            continue
        }

        $candidate = Join-Path $root $PathValue
        if (Test-Path $candidate) {
            return (Resolve-Path $candidate).Path
        }
    }

    return [System.IO.Path]::GetFullPath((Join-Path $SearchRoots[0] $PathValue))
}

function Get-AbsolutePath {
    param(
        [string]$PathValue,
        [string]$BasePath
    )

    if ([System.IO.Path]::IsPathRooted($PathValue)) {
        return [System.IO.Path]::GetFullPath($PathValue)
    }

    return [System.IO.Path]::GetFullPath((Join-Path $BasePath $PathValue))
}

function Get-RelativePath {
    param(
        [string]$BasePath,
        [string]$TargetPath
    )

    $baseFullPath = [System.IO.Path]::GetFullPath($BasePath)
    $targetFullPath = [System.IO.Path]::GetFullPath($TargetPath)

    $baseUri = New-Object System.Uri(($baseFullPath.TrimEnd('\') + '\'))
    $targetUri = New-Object System.Uri($targetFullPath)

    return ([System.Uri]::UnescapeDataString($baseUri.MakeRelativeUri($targetUri).ToString())).Replace('\', '/')
}

function Resolve-RelativeGlobs {
    param(
        [string]$RootPath,
        [object[]]$Patterns
    )

    $resolved = @()
    foreach ($pattern in @($Patterns)) {
        if ([string]::IsNullOrWhiteSpace([string]$pattern)) {
            continue
        }

        $candidatePattern = Join-Path $RootPath (([string]$pattern).Replace('/', '\'))
        $matches = Get-ChildItem -Path $candidatePattern -File -ErrorAction SilentlyContinue
        foreach ($match in $matches) {
            $relativePath = Normalize-RelativePath -PathValue (Get-RelativePath -BasePath $RootPath -TargetPath $match.FullName)
            if ($resolved -notcontains $relativePath) {
                $resolved += $relativePath
            }
        }
    }

    return $resolved | Sort-Object
}

function Test-MatchesAnyPattern {
    param(
        [string]$RelativePath,
        [object[]]$Patterns
    )

    $normalized = Normalize-RelativePath -PathValue $RelativePath
    foreach ($pattern in @($Patterns)) {
        if ([string]::IsNullOrWhiteSpace([string]$pattern)) {
            continue
        }

        $wildcard = Normalize-RelativePath -PathValue ([string]$pattern)
        if ($wildcard.EndsWith('/')) {
            $wildcard = "$wildcard*"
        }
        if ($normalized -like $wildcard) {
            return $true
        }
    }

    return $false
}

function Resolve-ProjectSlug {
    param(
        [string]$ProjectName,
        [string]$ProjectSlug
    )

    if (-not [string]::IsNullOrWhiteSpace($ProjectSlug)) {
        return $ProjectSlug.Trim()
    }

    if ([string]::IsNullOrWhiteSpace($ProjectName)) {
        return $null
    }

    $candidate = $ProjectName.ToLowerInvariant()
    $candidate = [System.Text.RegularExpressions.Regex]::Replace($candidate, '[^a-z0-9]+', '-').Trim('-')

    if ([string]::IsNullOrWhiteSpace($candidate)) {
        return ('project-{0}' -f (Get-Date -Format 'yyyyMMddHHmmss'))
    }

    return $candidate
}

function Expand-TemplatePlaceholders {
    param(
        [string]$Content,
        [hashtable]$Variables
    )

    $expanded = $Content
    foreach ($key in ($Variables.Keys | Sort-Object { $_.Length } -Descending)) {
        $expanded = $expanded.Replace("{{${key}}}", [string]$Variables[$key])
    }

    return $expanded
}

function Write-Utf8File {
    param(
        [string]$Path,
        [string]$Content
    )

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Test-IsTextTemplateFile {
    param(
        [string]$RelativePath,
        [object[]]$TextExtensions
    )

    $extension = [System.IO.Path]::GetExtension($RelativePath).ToLowerInvariant()
    return ($TextExtensions -contains $extension)
}

function Get-RenderedTemplateContent {
    param(
        [string]$SourceRoot,
        [string]$RelativePath,
        [object[]]$TextExtensions,
        [hashtable]$Variables
    )

    $sourcePath = Join-Path $SourceRoot ($RelativePath.Replace('/', '\'))
    if (Test-IsTextTemplateFile -RelativePath $RelativePath -TextExtensions $TextExtensions) {
        $content = [System.IO.File]::ReadAllText($sourcePath)
        return Expand-TemplatePlaceholders -Content $content -Variables $Variables
    }

    return $null
}

function Write-ManagedTemplateFile {
    param(
        [string]$SourceRoot,
        [string]$DestinationRoot,
        [string]$RelativePath,
        [object[]]$TextExtensions,
        [hashtable]$Variables
    )

    $sourcePath = Join-Path $SourceRoot ($RelativePath.Replace('/', '\'))
    $destinationPath = Join-Path $DestinationRoot ($RelativePath.Replace('/', '\'))

    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destinationPath) | Out-Null

    if (Test-IsTextTemplateFile -RelativePath $RelativePath -TextExtensions $TextExtensions) {
        $rendered = Get-RenderedTemplateContent -SourceRoot $SourceRoot -RelativePath $RelativePath -TextExtensions $TextExtensions -Variables $Variables
        Write-Utf8File -Path $destinationPath -Content $rendered
        return
    }

    Copy-Item -Path $sourcePath -Destination $destinationPath -Force
}

function Get-ManagedFileAction {
    param(
        [string]$SourceRoot,
        [string]$DestinationRoot,
        [string]$RelativePath,
        [object[]]$TextExtensions,
        [hashtable]$Variables
    )

    $destinationPath = Join-Path $DestinationRoot ($RelativePath.Replace('/', '\'))
    if (-not (Test-Path $destinationPath)) {
        return "create"
    }

    if (Test-IsTextTemplateFile -RelativePath $RelativePath -TextExtensions $TextExtensions) {
        $rendered = Get-RenderedTemplateContent -SourceRoot $SourceRoot -RelativePath $RelativePath -TextExtensions $TextExtensions -Variables $Variables
        $existing = [System.IO.File]::ReadAllText($destinationPath)
        if ($existing -eq $rendered) {
            return "unchanged"
        }

        return "update"
    }

    return "update"
}

function New-ScaffoldPlan {
    param(
        [hashtable]$Manifest,
        [hashtable]$ProfileConfig,
        [hashtable]$ProjectConfig
    )

    $directories = Merge-UniqueArray `
        -Left (Get-ConfigArray -Config $Manifest -Path @('baseDirectories')) `
        -Right (Merge-UniqueArray `
            -Left (Get-ConfigArray -Config $ProfileConfig -Path @('extraDirectories')) `
            -Right (Get-ConfigArray -Config $ProjectConfig -Path @('scaffold', 'extraDirectories')))

    $includeGlobs = Merge-UniqueArray `
        -Left (Get-ConfigArray -Config $Manifest -Path @('scaffoldGlobs')) `
        -Right (Merge-UniqueArray `
            -Left (Get-ConfigArray -Config $ProfileConfig -Path @('includeGlobs')) `
            -Right (Get-ConfigArray -Config $ProjectConfig -Path @('scaffold', 'includeGlobs')))

    $excludeGlobs = Merge-UniqueArray `
        -Left (Get-ConfigArray -Config $ProfileConfig -Path @('excludeGlobs')) `
        -Right (Get-ConfigArray -Config $ProjectConfig -Path @('scaffold', 'excludeGlobs'))

    $managedGlobs = Merge-UniqueArray `
        -Left (Get-ConfigArray -Config $Manifest -Path @('syncDefaults', 'managedGlobs')) `
        -Right (Merge-UniqueArray `
            -Left (Get-ConfigArray -Config $ProfileConfig -Path @('sync', 'managedExtraGlobs')) `
            -Right (Get-ConfigArray -Config $ProjectConfig -Path @('scaffold', 'includeGlobs')))

    $protectedPrefixes = Merge-UniqueArray `
        -Left (Get-ConfigArray -Config $Manifest -Path @('syncDefaults', 'protectedPrefixes')) `
        -Right (Merge-UniqueArray `
            -Left (Get-ConfigArray -Config $ProfileConfig -Path @('sync', 'protectedPrefixes')) `
            -Right (Get-ConfigArray -Config $ProjectConfig -Path @('scaffold', 'protectedPrefixes')))

    return @{
        directories = $directories
        includeGlobs = $includeGlobs
        excludeGlobs = $excludeGlobs
        managedGlobs = $managedGlobs
        protectedPrefixes = $protectedPrefixes
    }
}
