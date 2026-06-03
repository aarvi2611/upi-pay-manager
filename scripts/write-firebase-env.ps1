<#
Script: write-firebase-env.ps1
Usage:
  powershell -NoExit -ExecutionPolicy Bypass -File .\scripts\write-firebase-env.ps1

This script reads serviceAccount.json from your Desktop, base64-encodes it,
and writes FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_PROJECT_ID to the project's .env file.
#>

param(
    [string]$ServiceAccountPath = "$env:USERPROFILE\Desktop\serviceAccount.json",
    [string]$EnvPath = (Join-Path (Split-Path $PSScriptRoot -Parent) ".env")
)

Write-Output "Service account path: $ServiceAccountPath"
Write-Output "Target .env path: $EnvPath"

if (-not (Test-Path $ServiceAccountPath)) {
    Write-Error "serviceAccount.json not found at $ServiceAccountPath"
    exit 1
}

try {
    $saJson = Get-Content -Raw $ServiceAccountPath
} catch {
    Write-Error "Failed to read service account file: $_"
    exit 1
}

try {
    $b64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($saJson))
} catch {
    Write-Error "Failed to base64-encode service account JSON: $_"
    exit 1
}

try {
    $projectId = (ConvertFrom-Json $saJson).project_id
} catch {
    Write-Error "Failed to parse project_id from service account JSON: $_"
    exit 1
}

if (-not (Test-Path $EnvPath)) {
    New-Item -Path $EnvPath -ItemType File -Force | Out-Null
}

# Remove any existing FIREBASE entries
(Get-Content $EnvPath) | Where-Object { $_ -notmatch '^(FIREBASE_SERVICE_ACCOUNT_KEY|FIREBASE_PROJECT_ID)=' } | Set-Content $EnvPath -Encoding ASCII

Add-Content $EnvPath "FIREBASE_SERVICE_ACCOUNT_KEY=$b64"
Add-Content $EnvPath "FIREBASE_PROJECT_ID=$projectId"

Write-Output "Wrote FIREBASE_SERVICE_ACCOUNT_KEY and FIREBASE_PROJECT_ID to $EnvPath"
Write-Output "If PowerShell execution policy blocks running this script double-check by running with:"
Write-Output "  powershell -NoExit -ExecutionPolicy Bypass -File .\scripts\write-firebase-env.ps1"
