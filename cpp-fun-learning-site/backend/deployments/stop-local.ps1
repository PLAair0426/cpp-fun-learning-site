$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Split-Path -Parent $scriptDir
$repoRoot = Split-Path -Parent $backendRoot
$composeFile = Join-Path $scriptDir "docker-compose.yml"
$webPidFile = Join-Path $scriptDir ".web-dev.pid"

function Stop-ExistingWebProcess($repoRootPath) {
  $normalizedProjectRoot = [System.IO.Path]::GetFullPath($repoRootPath)
  $webProcesses = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object {
      $_.CommandLine -and
      $_.CommandLine.Contains($normalizedProjectRoot) -and
      $_.CommandLine.Contains("next\dist\server\lib\start-server.js")
    }

  foreach ($process in $webProcesses) {
    cmd.exe /c "taskkill /PID $($process.ProcessId) /T /F >NUL 2>NUL"
  }
}

function Resolve-DockerCli {
  $command = Get-Command docker -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $candidates = @(
    "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
    "C:\Program Files\Docker\Docker\resources\docker.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return $null
}

$dockerCli = Resolve-DockerCli

if (-not $dockerCli) {
  throw "Docker CLI not found. Please install Docker Desktop first."
}

Push-Location $backendRoot
try {
  if (Test-Path $webPidFile) {
    $webPid = Get-Content $webPidFile -ErrorAction SilentlyContinue
    if ($webPid) {
      cmd.exe /c "taskkill /PID $webPid /T /F >NUL 2>NUL"
    }
    Remove-Item $webPidFile -Force -ErrorAction SilentlyContinue
  }

  Stop-ExistingWebProcess -repoRootPath $repoRoot

  & $dockerCli compose -f $composeFile down
} finally {
  Pop-Location
}
