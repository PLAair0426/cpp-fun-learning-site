$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendRoot = Split-Path -Parent $scriptDir
$repoRoot = Split-Path -Parent $backendRoot
$composeFile = Join-Path $scriptDir "docker-compose.yml"
$envExample = Join-Path $backendRoot ".env.example"
$envFile = Join-Path $backendRoot ".env"
$webPidFile = Join-Path $scriptDir ".web-dev.pid"
$analysisDir = Join-Path $backendRoot "meta\generated\analysis"
$webStdoutLogFile = Join-Path $analysisDir "web-dev.stdout.log"
$webStderrLogFile = Join-Path $analysisDir "web-dev.stderr.log"

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

function Test-DockerDaemon($dockerCli) {
  try {
    $null = & $dockerCli version --format '{{.Server.Version}}' 2>$null
    return $true
  } catch {
    return $false
  }
}

function Get-AvailablePort([int]$preferredPort, [int[]]$reservedPorts = @()) {
  $candidate = $preferredPort
  while ($true) {
    $used = Get-NetTCPConnection -LocalPort $candidate -State Listen -ErrorAction SilentlyContinue
    $reserved = $reservedPorts -contains $candidate
    if (-not $used -and -not $reserved) {
      return $candidate
    }
    $candidate++
  }
}

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

$dockerCli = Resolve-DockerCli

if (-not $dockerCli) {
  throw "Docker CLI not found. Please install Docker Desktop first."
}

if (-not (Test-DockerDaemon $dockerCli)) {
  throw "Docker daemon is not running. Please start Docker Desktop and retry."
}

if (-not (Test-Path $envFile)) {
  Copy-Item $envExample $envFile
  Write-Host "Created local .env from .env.example" -ForegroundColor Cyan
}

Push-Location $backendRoot
try {
  Stop-ExistingWebProcess -repoRootPath $repoRoot

  $reservedPorts = @()
  $env:WEB_HOST_PORT = [string](Get-AvailablePort 3000 $reservedPorts)
  $reservedPorts += [int]$env:WEB_HOST_PORT
  $env:POSTGRES_HOST_PORT = [string](Get-AvailablePort 15432 $reservedPorts)
  $reservedPorts += [int]$env:POSTGRES_HOST_PORT
  $env:REDIS_HOST_PORT = [string](Get-AvailablePort 16379 $reservedPorts)
  $reservedPorts += [int]$env:REDIS_HOST_PORT
  $env:API_HOST_PORT = [string](Get-AvailablePort 18080 $reservedPorts)
  $reservedPorts += [int]$env:API_HOST_PORT
  $env:WORKER_HOST_PORT = [string](Get-AvailablePort 18081 $reservedPorts)
  $env:CORS_ORIGIN = "http://localhost:$($env:WEB_HOST_PORT)"
  $env:API_BASE_URL = "http://localhost:$($env:API_HOST_PORT)"
  $env:NEXT_PUBLIC_API_BASE_URL = "http://localhost:$($env:API_HOST_PORT)"

  Write-Host "Starting backend stack with Docker..." -ForegroundColor Cyan
  & $dockerCli compose -f $composeFile up --build -d postgres redis api worker

  Write-Host "Starting web locally with npm..." -ForegroundColor Cyan
  $webAppDir = Join-Path $repoRoot "frontend"
  New-Item -ItemType Directory -Force -Path $analysisDir | Out-Null
  $webProcess = Start-Process -FilePath "powershell.exe" `
    -ArgumentList @(
      "-NoProfile",
      "-Command",
      "`$env:API_BASE_URL='http://localhost:$($env:API_HOST_PORT)'; `$env:NEXT_PUBLIC_API_BASE_URL='http://localhost:$($env:API_HOST_PORT)'; Set-Location '$webAppDir'; npm run dev -- --port $($env:WEB_HOST_PORT)"
    ) `
    -RedirectStandardOutput $webStdoutLogFile `
    -RedirectStandardError $webStderrLogFile `
    -PassThru `
    -WindowStyle Minimized

  Set-Content -Path $webPidFile -Value $webProcess.Id -Encoding ascii

  Write-Host ""
  Write-Host "Local services are starting:" -ForegroundColor Green
  Write-Host "- Web:           http://localhost:$($env:WEB_HOST_PORT)"
  Write-Host "- API:           http://localhost:$($env:API_HOST_PORT)"
  Write-Host "- API Health:    http://localhost:$($env:API_HOST_PORT)/healthz"
  Write-Host "- Worker Health: http://localhost:$($env:WORKER_HOST_PORT)/healthz"
  Write-Host "- PostgreSQL:    localhost:$($env:POSTGRES_HOST_PORT)"
  Write-Host "- Redis:         localhost:$($env:REDIS_HOST_PORT)"
  Write-Host "- Web Log:       $webStdoutLogFile"
  Write-Host "- Web Err Log:   $webStderrLogFile"
  Write-Host ""
  Write-Host "Default mode uses ENABLE_MOCK_JUDGE=true from .env." -ForegroundColor Yellow
  Write-Host "Web is running from the local Node process instead of the Docker web image." -ForegroundColor Yellow
  Write-Host "To switch to real Judge0, edit .env and set ENABLE_MOCK_JUDGE=false with JUDGE0_URL." -ForegroundColor Yellow
} finally {
  Pop-Location
}
