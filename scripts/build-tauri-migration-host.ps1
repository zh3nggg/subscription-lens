param(
  [ValidateSet("check", "build", "release")]
  [string]$Action = "check",
  [string]$TargetDir = "$env:TEMP\subscription-lens-tauri-target",
  [string]$RuntimeDir = ""
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$hostDir = Join-Path $projectRoot "native\subscription-lens-tauri"
$hostConfig = Get-Content -LiteralPath (Join-Path $hostDir "tauri.conf.json") -Raw | ConvertFrom-Json
$hostMain = Get-Content -LiteralPath (Join-Path $hostDir "src\main.rs") -Raw
if ($hostConfig.productName -ne "Subscription Lens" -or $hostConfig.build.frontendDist -ne "frontend" -or
    $hostConfig.app.windows[0].title -ne "Subscription Lens" -or
    $hostMain -notmatch "tauri::generate_context!\(\)" -or $hostMain -notmatch "cc_switch::run_with_context\(context\)") {
  throw "The Tauri host must pass its Subscription Lens context to the embedded CC Switch runtime."
}
$runtimeDir = if ([string]::IsNullOrWhiteSpace($RuntimeDir)) {
  Join-Path $projectRoot "native\cc-switch-runtime"
} else {
  [System.IO.Path]::GetFullPath($RuntimeDir)
}
$runtimePatches = @(
  (Join-Path $projectRoot "native\cc-switch-patches\0002-subscription-lens-tauri-host.patch"),
  (Join-Path $projectRoot "native\cc-switch-patches\0003-subscription-lens-device-sync.patch"),
  (Join-Path $projectRoot "native\cc-switch-patches\0004-gpt-6-sol-luna-pricing.patch"),
  (Join-Path $projectRoot "native\cc-switch-patches\0005-macos-r2-keychain.patch")
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
  $bundlePrepared = $true
  Copy-Item -Path (Join-Path $rendererDist '*') -Destination $providerBundleDir -Recurse -Force
  $providerIndex = Join-Path $providerBundleDir "index.html"
  $providerHtml = Get-Content -LiteralPath $providerIndex -Raw -Encoding UTF8
  if (-not $providerHtml.Contains('</head>')) {
    throw "CC Switch renderer entry point is missing its closing head tag."
  }
  $providerHtml = $providerHtml.Replace('</head>', '    <script defer src="../ccswitch-host.js"></script>' + "`n  </head>")
  Set-Content -LiteralPath $providerIndex -Value $providerHtml -Encoding UTF8 -NoNewline
  Push-Location $hostDir
  try {
    if ($Action -eq "release") {
      $tauriCli = Join-Path $runtimeDir "node_modules\@tauri-apps\cli\tauri.js"
      if (-not (Test-Path -LiteralPath $tauriCli)) {
        throw "The pinned CC Switch Tauri CLI is missing. Run pnpm install in native/cc-switch-runtime."
      }
      $previousTargetDir = $env:CARGO_TARGET_DIR
      $previousPath = $env:PATH
      $env:CARGO_TARGET_DIR = $TargetDir
      try {
        $cargoBinDir = Split-Path -Parent $cargo
        $env:PATH = "$cargoBinDir;$env:PATH"
        & node $tauriCli build --bundles nsis --ci
      } finally {
        if ($null -eq $previousTargetDir) { Remove-Item Env:CARGO_TARGET_DIR -ErrorAction SilentlyContinue }
        else { $env:CARGO_TARGET_DIR = $previousTargetDir }
        $env:PATH = $previousPath
      }
    } else {
      & $cargo @args
    }
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
