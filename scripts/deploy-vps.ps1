param(
    [string]$CommitMessage = "",
    [string]$Services = "",
    [string]$RepoUrl = "",
    [switch]$SkipCommit,
    [switch]$SkipPush,
    [switch]$SkipDeploy,
    [switch]$AllowUntracked,
    [switch]$Yes
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-RepoStatus {
    $lines = git status --porcelain
    $entries = @()
    foreach ($line in $lines) {
        if (-not $line) { continue }
        $entries += [PSCustomObject]@{
            Code = $line.Substring(0, 2)
            Path = $line.Substring(3).Trim()
            Raw  = $line
        }
    }
    return @($entries)
}

function Require-EnvValue {
    param(
        [string]$Value,
        [string]$Prompt,
        [string]$Default = ""
    )

    if ($Value) { return $Value }
    $inputValue = Read-Host $Prompt
    if (-not $inputValue) { return $Default }
    return $inputValue
}

function Confirm-OrThrow {
    param(
        [string]$Prompt,
        [switch]$AutoApprove
    )

    if ($AutoApprove) { return }
    $answer = Read-Host $Prompt
    if ($answer -notin @("y", "Y", "yes", "YES")) {
        throw "Cancelled by user."
    }
}

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

    $servicesValue = if ($Services) { $Services } elseif ($env:DEPLOY_SERVICES) { $env:DEPLOY_SERVICES } else { "backend users super-admin" }
    $serviceList = @($servicesValue -split "\s+" | Where-Object { $_ })

    $validServices = @("backend", "users", "super-admin", "postgres", "redis", "prisma-migrate")
    $invalidServices = @($serviceList | Where-Object { $_ -notin $validServices })
    if ($invalidServices.Count -gt 0) {
        throw "Unknown services: $($invalidServices -join ', ')"
    }
    $servicesArg = ($serviceList -join ' ').Trim()

    $statusEntries = @(Get-RepoStatus)
    $trackedEntries = @($statusEntries | Where-Object { $_.Code -ne '??' })
    $untrackedEntries = @($statusEntries | Where-Object { $_.Code -eq '??' })

    if (-not $SkipCommit) {
        if ($statusEntries.Count -eq 0) {
            Write-Host "No local changes to commit."
        }
        else {
            Write-Host "Pending changes:"
            git status --short

            if ($untrackedEntries.Count -gt 0 -and -not $AllowUntracked) {
                throw "Untracked files detected. Commit or remove them first, or rerun with -AllowUntracked."
            }

            if ($trackedEntries.Count -eq 0 -and $untrackedEntries.Count -gt 0 -and $AllowUntracked) {
                Confirm-OrThrow -Prompt "Commit untracked files too? (y/N)" -AutoApprove:$Yes
            }
            elseif ($trackedEntries.Count -gt 0) {
                Confirm-OrThrow -Prompt "Commit the tracked changes listed above? (y/N)" -AutoApprove:$Yes
            }

            git add --update
            if ($AllowUntracked -and $untrackedEntries.Count -gt 0) {
                foreach ($entry in $untrackedEntries) {
                    git add -- $entry.Path
                }
            }

            $stagedStatus = git diff --cached --name-only
            if (-not $stagedStatus) {
                throw "Nothing was staged for commit."
            }

            git commit -m $CommitMessage
        }
    }

    if (-not $SkipPush) {
        git push origin $branch
    }

    if (-not $SkipDeploy) {
        if (-not $RepoUrl) {
            if ($env:DEPLOY_REPO_URL) {
                $RepoUrl = $env:DEPLOY_REPO_URL
            }
            else {
                $RepoUrl = (git remote get-url origin).Trim()
            }
        }
        if (-not $RepoUrl) {
            throw "Git repo URL not found. Set DEPLOY_REPO_URL or pass -RepoUrl."
        }

        $vpsHost = Require-EnvValue -Value $env:DEPLOY_VPS_HOST -Prompt "VPS host/IP"
        $vpsUser = Require-EnvValue -Value $env:DEPLOY_VPS_USER -Prompt "VPS user (default: root)" -Default "root"
        $vpsPath = Require-EnvValue -Value $env:DEPLOY_VPS_PATH -Prompt "Project path on VPS (default: /root/rrreeennntttaaalll)" -Default "/root/rrreeennntttaaalll"
        $hostKey = $env:DEPLOY_VPS_HOSTKEY
        $password = $env:DEPLOY_VPS_PASSWORD

        Write-Host "Deploy target: $vpsUser@$vpsHost"
        Write-Host "Services: $servicesArg"
        Confirm-OrThrow -Prompt "Proceed with VPS deploy? (y/N)" -AutoApprove:$Yes

        $servicesArgs = if ($servicesArg) { " $servicesArg" } else { "" }

        $remoteCmdTemplate = @'
set -e
REPO_URL='__REPO_URL__'
BRANCH='__BRANCH__'
VPS_PATH='__VPS_PATH__'

REPO_URL=$(printf '%s' "$REPO_URL" | tr -d '\r')
BRANCH=$(printf '%s' "$BRANCH" | tr -d '\r')
VPS_PATH=$(printf '%s' "$VPS_PATH" | tr -d '\r')

if [ -d "$VPS_PATH/.git" ]; then
  echo "Repo exists at $VPS_PATH"
else
  git clone "$REPO_URL" "$VPS_PATH"
fi

cd "$VPS_PATH"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

if [ ! -f ".env.production" ]; then echo "WARN: Missing .env.production"; fi
if [ ! -f "backend/.env.production" ]; then echo "WARN: Missing backend/.env.production"; fi

if docker compose version > /dev/null 2>&1; then DC='docker compose'; else DC='docker-compose'; fi

$DC --env-file .env.production up -d --build__SERVICES_ARGS__
$DC ps__SERVICES_ARGS__
'@.Trim()

        $remoteCmd = $remoteCmdTemplate.
            Replace("__REPO_URL__", $RepoUrl).
            Replace("__BRANCH__", $branch).
            Replace("__VPS_PATH__", $vpsPath).
            Replace("__SERVICES_ARGS__", $servicesArgs)

        $plink = Get-Command plink -ErrorAction SilentlyContinue
        if ($plink -and $password) {
            $args = @("-ssh", "-batch")
            if ($hostKey) {
                $args += @("-hostkey", $hostKey)
            }
            $args += @("$vpsUser@$vpsHost", "-pw", $password, $remoteCmd)
            & $plink.Source @args
        }
        else {
            $ssh = Get-Command ssh -ErrorAction SilentlyContinue
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
