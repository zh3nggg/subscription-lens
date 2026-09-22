param(
  [ValidateSet("check", "build")]
  [string]$Action = "check",
  [string]$TargetDir = "$env:TEMP\subscription-lens-tauri-target"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$hostDir = Join-Path $projectRoot "native\subscription-lens-tauri"
$runtimeDir = Join-Path $projectRoot "native\cc-switch-runtime"
$runtimePatch = Join-Path $projectRoot "native\cc-switch-patches\0002-subscription-lens-tauri-host.patch"
$cargoCommand = Get-Command cargo -ErrorAction SilentlyContinue
$cargo = if ($cargoCommand) { $cargoCommand.Source } else { $null }
if (-not $cargo) {
  $cargo = "C:\Users\Kanto\.cargo\bin\cargo.exe"
}
if (-not (Test-Path -LiteralPath $cargo)) {
  throw "cargo was not found. Install Rust before building the Tauri migration host."
}
if (-not (Test-Path -LiteralPath $runtimePatch)) {
  throw "Subscription Lens Tauri host patch is missing: $runtimePatch"
}

$patchAppliedHere = $false
$null = & git -C $runtimeDir apply --reverse --check $runtimePatch 2>&1
if ($LASTEXITCODE -ne 0) {
  $null = & git -C $runtimeDir apply --check $runtimePatch 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "The pinned CC Switch runtime does not match the Subscription Lens host patch."
  }
  & git -C $runtimeDir apply $runtimePatch
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  $patchAppliedHere = $true
}

$args = @($Action, "--target-dir", $TargetDir)
try {
  Push-Location $runtimeDir
  try {
    $env:VITE_SUBLENS_HOST = "1"
    & pnpm run build:renderer
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } finally {
    Remove-Item Env:VITE_SUBLENS_HOST -ErrorAction SilentlyContinue
    Pop-Location
  }

  Push-Location $hostDir
  try {
    & $cargo @args
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } finally {
    Pop-Location
  }
} finally {
  if ($patchAppliedHere) {
    & git -C $runtimeDir apply --reverse $runtimePatch
    if ($LASTEXITCODE -ne 0) {
      Write-Warning "Could not restore the clean CC Switch runtime after the build."
    }
  }
}
