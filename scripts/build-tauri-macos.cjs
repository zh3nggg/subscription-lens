'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const runtimeDir = path.join(root, 'native', 'cc-switch-runtime');
const hostDir = path.join(root, 'native', 'subscription-lens-tauri');
const providerBundleDir = path.join(hostDir, 'frontend', 'ccswitch');
const rendererDist = path.join(runtimeDir, 'dist');
const targetDir = path.resolve(process.env.SUBLENS_TAURI_TARGET_DIR || path.join(os.tmpdir(), 'subscription-lens-tauri-macos-target'));
const outputDir = path.join(root, 'dist', 'tauri-macos');
const patches = [
  path.join(root, 'native', 'cc-switch-patches', '0002-subscription-lens-tauri-host.patch'),
  path.join(root, 'native', 'cc-switch-patches', '0003-subscription-lens-device-sync.patch'),
  path.join(root, 'native', 'cc-switch-patches', '0004-gpt-6-sol-luna-pricing.patch'),
  path.join(root, 'native', 'cc-switch-patches', '0005-macos-r2-keychain.patch'),
];

function command(commandName, args, options = {}) {
  return spawnSync(commandName, args, { cwd: root, stdio: 'inherit', ...options });
}

function quiet(commandName, args, options = {}) {
  return spawnSync(commandName, args, { cwd: root, stdio: 'ignore', ...options });
}

function run(commandName, args, options = {}) {
  const result = command(commandName, args, options);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${commandName} exited with status ${result.status}`);
}

function verifyHostIdentity() {
  const config = JSON.parse(fs.readFileSync(path.join(hostDir, 'tauri.conf.json'), 'utf8'));
  const main = fs.readFileSync(path.join(hostDir, 'src', 'main.rs'), 'utf8');
  if (config.productName !== 'Subscription Lens' || config.build?.frontendDist !== 'frontend' ||
      config.app?.windows?.[0]?.title !== 'Subscription Lens' ||
      !main.includes('tauri::generate_context!()') || !main.includes('cc_switch::run_with_context(context)')) {
    throw new Error('The Tauri host must pass its Subscription Lens context to the embedded CC Switch runtime.');
  }
  return config.version;
}

function patchRuntime() {
  const applied = [];
  for (const patch of patches) {
    const relativePatch = path.relative(runtimeDir, patch);
    if (quiet('git', ['-C', runtimeDir, 'apply', '--reverse', '--check', relativePatch]).status === 0) continue;
    if (quiet('git', ['-C', runtimeDir, 'apply', '--check', relativePatch]).status !== 0) {
      throw new Error(`The pinned CC Switch runtime does not match ${path.basename(patch)}.`);
    }
    run('git', ['-C', runtimeDir, 'apply', relativePatch]);
    applied.push(relativePatch);
  }
  return applied;
}

function prepareProviderBundle() {
  const env = { ...process.env };
  delete env.VITE_SUBLENS_HOST;
  run(process.env.SUBLENS_PNPM || 'pnpm', ['run', 'build:renderer'], { cwd: runtimeDir, env });
  if (!fs.existsSync(rendererDist)) throw new Error(`CC Switch renderer build did not produce ${rendererDist}.`);
  fs.rmSync(providerBundleDir, { recursive: true, force: true });
  fs.cpSync(rendererDist, providerBundleDir, { recursive: true });
  const indexPath = path.join(providerBundleDir, 'index.html');
  const html = fs.readFileSync(indexPath, 'utf8');
  if (!html.includes('</head>')) throw new Error('CC Switch renderer entry point is missing its closing head tag.');
  fs.writeFileSync(indexPath, html.replace('</head>', '    <script defer src="../ccswitch-host.js"></script>\n  </head>'));
}

function findApp(base) {
  const pending = [base];
  while (pending.length) {
    const current = pending.pop();
    if (!fs.existsSync(current)) continue;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const candidate = path.join(current, entry.name);
      if (entry.isDirectory() && entry.name.endsWith('.app')) return candidate;
      if (entry.isDirectory()) pending.push(candidate);
    }
  }
  return null;
}

function sha256(file) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(file));
  return hash.digest('hex');
}

function collectArtifacts(version) {
  const bundleRoot = path.join(targetDir, 'aarch64-apple-darwin', 'release', 'bundle');
  const app = findApp(bundleRoot);
  if (!app) throw new Error(`Tauri did not produce an app bundle under ${bundleRoot}.`);
  fs.mkdirSync(outputDir, { recursive: true });
  const prefix = `Subscription-Lens-${version}-tauri-arm64`;
  const finalDmg = path.join(outputDir, `${prefix}.dmg`);
  const finalZip = path.join(outputDir, `${prefix}.zip`);
  const dmgStaging = path.join(targetDir, 'subscription-lens-dmg-staging');
  fs.rmSync(dmgStaging, { recursive: true, force: true });
  fs.mkdirSync(dmgStaging, { recursive: true });
  run('ditto', [app, path.join(dmgStaging, path.basename(app))]);
  fs.symlinkSync('/Applications', path.join(dmgStaging, 'Applications'), 'dir');
  if (fs.existsSync(finalDmg)) fs.rmSync(finalDmg);
  run('hdiutil', ['create', '-volname', 'Subscription Lens', '-srcfolder', dmgStaging, '-ov', '-format', 'UDZO', finalDmg]);
  if (fs.existsSync(finalZip)) fs.rmSync(finalZip);
  run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', app, finalZip]);
  const manifest = [finalDmg, finalZip]
    .map(file => `${sha256(file)}  ${path.basename(file)}`)
    .join('\n') + '\n';
  fs.writeFileSync(path.join(outputDir, `SHA256SUMS-${version}-tauri-macos.txt`), manifest);
  fs.writeFileSync(path.join(outputDir, 'SHA256SUMS-tauri-macos.txt'), manifest);
  console.log(`Tauri macOS artifacts written to ${outputDir}`);
}

if (process.platform !== 'darwin' || process.arch !== 'arm64') {
  throw new Error('The Tauri macOS package is intentionally limited to Apple Silicon.');
}

const version = verifyHostIdentity();
const appliedPatches = patchRuntime();
try {
  prepareProviderBundle();
  const tauriCli = path.join(runtimeDir, 'node_modules', '@tauri-apps', 'cli', 'tauri.js');
  if (!fs.existsSync(tauriCli)) throw new Error('Run pnpm install in native/cc-switch-runtime before building.');
  const env = { ...process.env, CARGO_TARGET_DIR: targetDir, APPLE_SIGNING_IDENTITY: process.env.APPLE_SIGNING_IDENTITY || '-' };
  run(process.execPath, [tauriCli, 'build', '--bundles', 'app', '--target', 'aarch64-apple-darwin', '--ci'], { cwd: hostDir, env });
  collectArtifacts(version);
} finally {
  fs.rmSync(providerBundleDir, { recursive: true, force: true });
  for (const patch of appliedPatches.reverse()) {
    const result = command('git', ['-C', runtimeDir, 'apply', '--reverse', patch]);
    if (result.status !== 0) console.warn(`Could not restore ${path.basename(patch)} from the pinned runtime.`);
  }
}
