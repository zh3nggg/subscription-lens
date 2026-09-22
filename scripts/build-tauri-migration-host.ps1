param(
  [ValidateSet("check", "build")]
  [string]$Action = "check",
  [string]$TargetDir = "$env:TEMP\subscription-lens-tauri-target"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$hostDir = Join-Path $projectRoot "native\subscription-lens-tauri"
$runtimeDir = Join-Path $projectRoot "native\cc-switch-runtime"
$runtimePatches = @(
  (Join-Path $projectRoot "native\cc-switch-patches\0002-subscription-lens-tauri-host.patch"),
  (Join-Path $projectRoot "native\cc-switch-patches\0003-subscription-lens-provider-manager.patch")
)
$providerBundleDir = Join-Path $hostDir "frontend\ccswitch"
$rendererDist = Join-Path $runtimeDir "dist"
$cargoCommand = Get-Command cargo -ErrorAction SilentlyContinue
$cargo = if ($cargoCommand) { $cargoCommand.Source } else { $null }
if (-not $cargo) {
  $cargo = "C:\Users\Kanto\.cargo\bin\cargo.exe"
}
if (-not (Test-Path -LiteralPath $cargo)) {
  throw "cargo was not found. Install Rust before building the Tauri migration host."
}
foreach ($runtimePatch in $runtimePatches) {
  if (-not (Test-Path -LiteralPath $runtimePatch)) {
    throw "Subscription Lens Tauri host patch is missing: $runtimePatch"
  }
}

$patchesAppliedHere = @()
foreach ($runtimePatch in $runtimePatches) {
  $null = & git -C $runtimeDir apply --reverse --check $runtimePatch 2>&1
  if ($LASTEXITCODE -ne 0) {
    $null = & git -C $runtimeDir apply --check $runtimePatch 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "The pinned CC Switch runtime does not match the Subscription Lens host patch: $runtimePatch"
    }
    & git -C $runtimeDir apply $runtimePatch
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    $patchesAppliedHere += $runtimePatch
  }
}

$args = @($Action, "--target-dir", $TargetDir)
$bundlePrepared = $false
$previousSubLensHost = $env:VITE_SUBLENS_HOST
try {
  # Build the untouched CCS React provider surface. It is copied only while
  # Tauri embeds assets, then removed so generated frontend files never become
  # source-controlled application code.
  Remove-Item Env:VITE_SUBLENS_HOST -ErrorAction SilentlyContinue
  Push-Location $runtimeDir
  try {
    & pnpm run build:renderer
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } finally {
    Pop-Location
  }
  if (-not (Test-Path -LiteralPath $rendererDist)) {
    throw "CC Switch renderer build did not produce $rendererDist"
  }
  if (Test-Path -LiteralPath $providerBundleDir) {
    Remove-Item -LiteralPath $providerBundleDir -Recurse -Force
  }
  New-Item -ItemType Directory -Path $providerBundleDir -Force | Out-Null
  Copy-Item -Path (Join-Path $rendererDist '*') -Destination $providerBundleDir -Recurse -Force
  $bundlePrepared = $true

  Push-Location $hostDir
  try {
    & $cargo @args
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } finally {
    Pop-Location
  }
} finally {
  if ($bundlePrepared -and (Test-Path -LiteralPath $providerBundleDir)) {
    Remove-Item -LiteralPath $providerBundleDir -Recurse -Force
  }
  if ($null -eq $previousSubLensHost) {
    Remove-Item Env:VITE_SUBLENS_HOST -ErrorAction SilentlyContinue
  } else {
    $env:VITE_SUBLENS_HOST = $previousSubLensHost
  }
  [array]::Reverse($patchesAppliedHere)
  foreach ($runtimePatch in $patchesAppliedHere) {
    & git -C $runtimeDir apply --reverse $runtimePatch
    if ($LASTEXITCODE -ne 0) {
      Write-Warning "Could not restore the clean CC Switch runtime after the build."
    }
  }
}
