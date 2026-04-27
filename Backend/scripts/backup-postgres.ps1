param(
  [string]$DatabaseUrl = $env:DATABASE_URL
)

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  Write-Error "DATABASE_URL is required"
  exit 1
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = Join-Path $PSScriptRoot "..\backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$outputFile = Join-Path $backupDir "farmerpremium-$timestamp.dump"

pg_dump $DatabaseUrl -Fc -f $outputFile
Write-Output "Backup created: $outputFile"
