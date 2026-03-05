param(
    [string]$CommitMessage = "",
    [string]$Services = "",
    [switch]$SkipCommit,
    [switch]$SkipPush,
    [switch]$SkipDeploy,
    [switch]$Yes
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$localConfig = Join-Path $scriptDir "deploy-vps.local.ps1"
if (Test-Path $localConfig) {
    . $localConfig
}

Push-Location $repoRoot
try {
    $branch = (git rev-parse --abbrev-ref HEAD).Trim()
    if (-not $branch) {
        throw "Cannot detect git branch."
    }

    if (-not $CommitMessage) {
        $CommitMessage = "chore: deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }

    $status = git status --porcelain
    if (-not $SkipCommit) {
        if ($status) {
            Write-Host "Pending changes:"
            git status --short
            if (-not $Yes) {
                $confirm = Read-Host "Commit all changes above? (y/N)"
                if ($confirm -notin @("y", "Y", "yes", "YES")) {
                    throw "Cancelled by user."
                }
            }

            git add -A
            git commit -m $CommitMessage
        }
        else {
            Write-Host "No local changes to commit."
        }
    }

    if (-not $SkipPush) {
        git push origin $branch
    }

    if (-not $SkipDeploy) {
        $vpsHost = if ($env:DEPLOY_VPS_HOST) { $env:DEPLOY_VPS_HOST } else { Read-Host "VPS host/IP" }
        $vpsUser = if ($env:DEPLOY_VPS_USER) { $env:DEPLOY_VPS_USER } else { Read-Host "VPS user (default: root)" }
        if (-not $vpsUser) { $vpsUser = "root" }
        $vpsPath = if ($env:DEPLOY_VPS_PATH) { $env:DEPLOY_VPS_PATH } else { Read-Host "Project path on VPS (default: /root/rrreeennntttaaalll)" }
        if (-not $vpsPath) { $vpsPath = "/root/rrreeennntttaaalll" }
        $hostKey = $env:DEPLOY_VPS_HOSTKEY
        $password = $env:DEPLOY_VPS_PASSWORD
        if (-not $Services) {
            $Services = if ($env:DEPLOY_SERVICES) { $env:DEPLOY_SERVICES } else { "backend web-viewer rental-admin super-admin" }
        }

        $remoteCmd = @"
set -e
cd '$vpsPath'
git fetch origin
git checkout '$branch'
git pull --ff-only origin '$branch'
docker-compose up -d --build $Services
docker-compose ps
"@.Trim()

        $plink = (Get-Command plink -ErrorAction SilentlyContinue)
        if ($plink -and $password) {
            $args = @("-ssh", "-batch")
            if ($hostKey) {
                $args += @("-hostkey", $hostKey)
            }
            $args += @("$vpsUser@$vpsHost", "-pw", $password, $remoteCmd)
            & $plink.Source @args
        }
        else {
            $ssh = (Get-Command ssh -ErrorAction SilentlyContinue)
            if (-not $ssh) {
                throw "Neither plink nor ssh is available."
            }
            & $ssh.Source "$vpsUser@$vpsHost" $remoteCmd
        }

        if ($LASTEXITCODE -ne 0) {
            throw "VPS deploy failed with exit code $LASTEXITCODE."
        }
    }

    Write-Host "Deploy completed."
}
finally {
    Pop-Location
}
