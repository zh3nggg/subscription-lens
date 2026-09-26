#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
host="$root/native/subscription-lens-tauri"
runtime="$root/native/cc-switch-runtime"
node - "$host" <<'JS'
const fs = require('node:fs');
const path = require('node:path');
const host = process.argv[2];
const config = JSON.parse(fs.readFileSync(path.join(host, 'tauri.conf.json'), 'utf8'));
const main = fs.readFileSync(path.join(host, 'src/main.rs'), 'utf8');
if (config.productName !== 'Subscription Lens' || config.build.frontendDist !== 'frontend' ||
    config.app.windows[0].title !== 'Subscription Lens' || !main.includes('cc_switch::run_with_context(context)')) {
  throw new Error('The Linux build must use the Subscription Lens host and frontend.');
}
JS
[[ $(uname -m) == x86_64 ]] || { echo 'This build targets Ubuntu 22.04 x64.' >&2; exit 1; }
source /etc/os-release
[[ "$ID" == ubuntu && "$VERSION_ID" == 22.04 ]] || { echo 'Build on Ubuntu 22.04 for the supported ABI.' >&2; exit 1; }
for patch in 0002-subscription-lens-tauri-host.patch 0003-subscription-lens-device-sync.patch 0004-subscription-lens-linux.patch 0005-subscription-lens-model-totals.patch; do
  file="$root/native/cc-switch-patches/$patch"
  # The 3.1.1 tag stores some patch files with Windows line endings.
  sed -i 's/\r$//' "$file"
  # Later patches extend files created by earlier patches, so reverse-checking
  # an earlier patch is not sufficient to detect an already prepared runtime.
  case "$patch" in
    0002-*) grep -q 'pub fn run_with_context(context:' "$runtime/src-tauri/src/lib.rs" && continue ;;
    0003-*) if [[ -f "$runtime/src-tauri/src/sublens_devices.rs" && -f "$runtime/src-tauri/src/sublens_monitor.rs" ]] && grep -q 'pub(crate) async fn list_objects_v2' "$runtime/src-tauri/src/services/s3.rs"; then continue; fi ;;
    0004-*) grep -q 'fn linux_secret(' "$runtime/src-tauri/src/sublens_devices.rs" && continue ;;
    0005-*) grep -q 'Sublens: expose cache-inclusive model totals' "$runtime/src-tauri/src/services/usage_stats.rs" && continue ;;
  esac
  if ! git -C "$runtime" apply --reverse --check "$file" 2>/dev/null; then
    git -C "$runtime" apply --check "$file"
    git -C "$runtime" apply "$file"
  fi
done
node "$root/scripts/test-linux-compat.cjs" "$root"
unset VITE_SUBLENS_HOST
cd "$runtime"
pnpm install --frozen-lockfile
pnpm run build:renderer
mkdir -p "$host/frontend/ccswitch"
cp -a dist/. "$host/frontend/ccswitch/"
node - "$host/frontend/ccswitch/index.html" <<'JS'
const fs = require('node:fs');
const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');
if (!html.includes('</head>')) throw new Error('Missing provider renderer head');
fs.writeFileSync(file, html.replace('</head>', '<script defer src="../ccswitch-host.js"></script></head>'));
JS
cd "$host"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$root/work/linux-target}"
node "$runtime/node_modules/@tauri-apps/cli/tauri.js" build --config tauri.linux.conf.json --bundles deb --ci -- --locked
