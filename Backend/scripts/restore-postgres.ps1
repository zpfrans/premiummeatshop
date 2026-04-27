param(
  [Parameter(Mandatory = $true)]
  [string]$DumpFile,
  [string]$DatabaseUrl = $env:DATABASE_URL
)

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  Write-Error "DATABASE_URL is required"
  exit 1
}

pg_restore --clean --no-owner --no-privileges -d $DatabaseUrl $DumpFile
Write-Output "Restore completed from: $DumpFile"
