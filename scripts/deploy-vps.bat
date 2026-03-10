@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"
set "ENV_FILE=%ROOT%\backend\.env"

if not exist "%ENV_FILE%" (
  echo Missing %ENV_FILE%.
  exit /b 1
)

call :load_env "%ENV_FILE%"

if defined VPS_HOST (set "HOST=!VPS_HOST!")
if not defined HOST if defined IP (set "HOST=!IP!")
if not defined HOST (
  echo VPS host/IP not found. Add VPS_HOST or IP to backend\.env.
  exit /b 1
)

if defined VPS_PASSWORD (set "PASS=!VPS_PASSWORD!")
if not defined PASS if defined password (set "PASS=!password!")
if not defined PASS (
  echo VPS password not found. Add VPS_PASSWORD or password to backend\.env.
  exit /b 1
)

if defined VPS_USER (set "USER=!VPS_USER!") else set "USER=root"
if defined VPS_HOSTKEY (set "HOSTKEY=!VPS_HOSTKEY!")

if defined GITHUB_REPO_URL (set "REPO_URL=!GITHUB_REPO_URL!")
if not defined REPO_URL (
  for /f "delims=" %%R in ('git -C "%ROOT%" remote get-url origin') do set "REPO_URL=%%R"
)
if not defined REPO_URL (
  echo GitHub repo URL not found. Set GITHUB_REPO_URL in backend\.env or configure git remote.
  exit /b 1
)

for /f "usebackq delims=" %%R in (`powershell -NoProfile -Command "(Split-Path -Leaf '%REPO_URL%').Replace('.git','')"` ) do set "REPO_NAME=%%R"

if defined VPS_PATH (set "REMOTE_PATH=!VPS_PATH!") else set "REMOTE_PATH=/root/%REPO_NAME%"

for /f "delims=" %%B in ('git -C "%ROOT%" rev-parse --abbrev-ref HEAD') do set "BRANCH=%%B"

where plink >nul 2>&1
if %errorlevel%==0 (set "USE_PLINK=1") else set "USE_PLINK=0"

set "REMOTE_SCRIPT=%TEMP%\rental-deploy-%RANDOM%.sh"
> "%REMOTE_SCRIPT%" echo set -e
>> "%REMOTE_SCRIPT%" echo REPO_URL='!REPO_URL!'
>> "%REMOTE_SCRIPT%" echo BRANCH='!BRANCH!'
>> "%REMOTE_SCRIPT%" echo VPS_PATH='!REMOTE_PATH!'
>> "%REMOTE_SCRIPT%" echo REPO_URL=$(printf '%%s' "$REPO_URL" ^| tr -d '\r')
>> "%REMOTE_SCRIPT%" echo BRANCH=$(printf '%%s' "$BRANCH" ^| tr -d '\r')
>> "%REMOTE_SCRIPT%" echo VPS_PATH=$(printf '%%s' "$VPS_PATH" ^| tr -d '\r')
>> "%REMOTE_SCRIPT%" echo echo "VPS_PATH=$VPS_PATH"
>> "%REMOTE_SCRIPT%" echo ls -la "$VPS_PATH"
>> "%REMOTE_SCRIPT%" echo ls -la "$VPS_PATH/.git" ^|^| true
>> "%REMOTE_SCRIPT%" echo if ^[ -d "$VPS_PATH/.git" ^]; then echo "Repo exists"; else git clone "$REPO_URL" "$VPS_PATH"; fi
>> "%REMOTE_SCRIPT%" echo cd "$VPS_PATH"
>> "%REMOTE_SCRIPT%" echo git fetch --all
>> "%REMOTE_SCRIPT%" echo git checkout "$BRANCH"
>> "%REMOTE_SCRIPT%" echo git pull --ff-only origin "$BRANCH"
>> "%REMOTE_SCRIPT%" echo if ^[ ! -f ".env.production" ^]; then echo 'WARN: Missing .env.production'; fi
>> "%REMOTE_SCRIPT%" echo if ^[ ! -f "backend/.env.production" ^]; then echo 'WARN: Missing backend/.env.production'; fi
>> "%REMOTE_SCRIPT%" echo if docker compose version ^> /dev/null 2^>^&1; then DC='docker compose'; else DC='docker-compose'; fi
>> "%REMOTE_SCRIPT%" echo $DC --env-file .env.production up -d --build
>> "%REMOTE_SCRIPT%" echo $DC ps

if "%USE_PLINK%"=="1" (
  if defined HOSTKEY (
    plink -ssh -batch -hostkey "!HOSTKEY!" -pw "!PASS!" !USER!@!HOST! -m "%REMOTE_SCRIPT%"
  ) else (
    plink -ssh -batch -pw "!PASS!" !USER!@!HOST! -m "%REMOTE_SCRIPT%"
  )
) else (
  type "%REMOTE_SCRIPT%" | ssh !USER!@!HOST! "bash -s"
)

set "EXIT_CODE=%ERRORLEVEL%"
del "%REMOTE_SCRIPT%"
exit /b %EXIT_CODE%

:load_env
set "ENV_PATH=%~1"
for /f "usebackq delims=" %%L in ("%ENV_PATH%") do (
  set "LINE=%%L"
  if not "!LINE!"=="" if "!LINE:~0,1!" NEQ "#" (
    for /f "tokens=1,* delims==" %%K in ("!LINE!") do set "%%K=%%L"
  )
)
exit /b 0
