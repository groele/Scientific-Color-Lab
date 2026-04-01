param()

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Push-Location $root

try {
  npm install
  npm run build
  & (Join-Path $PSScriptRoot "export-with-powerpoint.ps1")
}
finally {
  Pop-Location
}
