param(
  [ValidateSet("check", "build")]
  [string]$Action = "check",
  [string]$TargetDir = "$env:TEMP\subscription-lens-tauri-target"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$hostDir = Join-Path $projectRoot "native\subscription-lens-tauri"
$cargoCommand = Get-Command cargo -ErrorAction SilentlyContinue
$cargo = if ($cargoCommand) { $cargoCommand.Source } else { $null }
if (-not $cargo) {
  $cargo = "C:\Users\Kanto\.cargo\bin\cargo.exe"
}
if (-not (Test-Path -LiteralPath $cargo)) {
  throw "cargo was not found. Install Rust before building the Tauri migration host."
}

$args = @($Action, "--target-dir", $TargetDir)
Push-Location $hostDir
try {
  & $cargo @args
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
  Pop-Location
}
