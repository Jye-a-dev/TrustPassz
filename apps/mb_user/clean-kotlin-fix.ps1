# clean-kotlin-fix.ps1 - TrustPassz Android/Kotlin Cache & Lock Purge
$ErrorActionPreference = "SilentlyContinue"

$targetDir = if (Test-Path "$PSScriptRoot\pubspec.yaml") { 
    $PSScriptRoot 
} elseif (Test-Path "$PSScriptRoot\apps\mb_user\pubspec.yaml") { 
    "$PSScriptRoot\apps\mb_user" 
} else { 
    (Get-Location).Path 
}

Write-Host "[TrustPassz] Target directory: $targetDir" -ForegroundColor Cyan

# 1. Stop Gradle Daemon
Write-Host "[1/4] Stopping Gradle Daemons..." -ForegroundColor Yellow
if (Test-Path "$targetDir\android\gradlew.bat") {
    Start-Process -FilePath "$targetDir\android\gradlew.bat" -ArgumentList "--stop" -WorkingDirectory "$targetDir\android" -NoNewWindow -Wait
}

# 2. Terminate locking background processes
Write-Host "[2/4] Killing locks (java.exe, adb.exe)..." -ForegroundColor Yellow
Get-Process -Name java, adb -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 3. Purge corrupted incremental caches and build artifacts
Write-Host "[3/4] Purging build directories and .tab cache locks..." -ForegroundColor Yellow
$purgeTargets = @(
    "$targetDir\build",
    "$targetDir\.dart_tool",
    "$targetDir\android\.gradle",
    "$targetDir\android\app\build"
)

foreach ($path in $purgeTargets) {
    if (Test-Path $path) {
        Write-Host "  Removing: $path"
        Remove-Item -LiteralPath $path -Recurse -Force -ErrorAction SilentlyContinue
    }
}

# 4. Re-sync dependencies
Write-Host "[4/4] Fetching Flutter dependencies..." -ForegroundColor Yellow
Push-Location $targetDir
& flutter pub get
Pop-Location

Write-Host "[TrustPassz] Reset completed successfully." -ForegroundColor Green

