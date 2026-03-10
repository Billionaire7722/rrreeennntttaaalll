param(
    [switch]$SkipInstall,
    [switch]$SkipMigrate,
    [switch]$SkipSeed
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$backendDir = Join-Path $repoRoot "backend"
$usersDir = Join-Path $repoRoot "users"
$adminDir = Join-Path $repoRoot "super-admin-dashboard"

function Get-DockerComposeCommand {
    $docker = Get-Command docker -ErrorAction SilentlyContinue
    if ($docker) {
        try {
            docker compose version *> $null
            if ($LASTEXITCODE -eq 0) { return "docker compose" }
        }
        catch {
        }
    }

    $dockerCompose = Get-Command docker-compose -ErrorAction SilentlyContinue
    if ($dockerCompose) { return "docker-compose" }

    throw "Docker Compose not found. Install Docker Desktop or docker-compose."
}

function Ensure-NodeModules {
    param([string]$Path)
    if ($SkipInstall) { return }
    if (-not (Test-Path (Join-Path $Path "node_modules"))) {
        Write-Host "Installing dependencies in $Path..."
        Push-Location $Path
        npm install
        Pop-Location
    }
}

Write-Host "Starting Docker services (postgres, redis)..."
$dc = Get-DockerComposeCommand
& $dc -f "$repoRoot\docker-compose.yml" -f "$repoRoot\docker-compose.local.yml" up -d postgres redis

Write-Host "Waiting for database..."
Start-Sleep -Seconds 5

Ensure-NodeModules $backendDir
Ensure-NodeModules $usersDir
Ensure-NodeModules $adminDir

Write-Host "Starting backend (NestJS)..."
$backendCmd = @()
if (-not $SkipMigrate) { $backendCmd += "npx prisma migrate deploy" }
if (-not $SkipSeed) { $backendCmd += "npx prisma db seed" }
$backendCmd += "npm run start:dev"
Start-Process powershell -WorkingDirectory $backendDir -ArgumentList "-NoExit", "-Command", ($backendCmd -join "; ")

Write-Host "Starting users (Next.js)..."
$usersCmd = '$env:NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"; npm run dev'
Start-Process powershell -WorkingDirectory $usersDir -ArgumentList "-NoExit", "-Command", $usersCmd

Write-Host "Starting super admin (Vite)..."
$adminCmd = '$env:VITE_API_BASE_URL="http://localhost:3000"; npm run dev'
Start-Process powershell -WorkingDirectory $adminDir -ArgumentList "-NoExit", "-Command", $adminCmd

Write-Host ""
Write-Host "Services started:"
Write-Host "  Backend:    http://localhost:3000"
Write-Host "  Users:      http://localhost:3002"
Write-Host "  SuperAdmin: http://localhost:5173"
Write-Host ""
Write-Host "Default accounts (local seed):"
Write-Host "  Super Admin: superadmin@local.test / Admin@123"
Write-Host "  User:        user1@local.test / User@1234"
Write-Host "  User:        user2@local.test / User@1234"
