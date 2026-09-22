'use strict';

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const macOutput = process.platform === 'darwin'
  ? fs.mkdtempSync(path.join(os.tmpdir(), 'subscription-lens-macos-build-'))
  : null;
const args = process.platform === 'darwin'
  ? ['electron-builder', '--mac', 'dmg', 'zip', '--arm64', `--config.directories.output=${macOutput}`]
  : process.platform === 'win32'
    ? ['electron-builder', '--win', 'nsis', 'zip', '--x64']
    : null;

if (!args) throw new Error(`Desktop packaging is not configured for ${process.platform}.`);
if (process.platform === 'darwin' && process.arch !== 'arm64') {
  throw new Error('The macOS package is intentionally limited to Apple Silicon (arm64).');
}

const cli = require.resolve('electron-builder/cli.js');
const result = spawnSync(process.execPath, [cli, ...args.slice(1)], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) {
  process.exitCode = result.status ?? 1;
} else if (macOutput) {
  const destination = path.resolve(__dirname, '..', 'dist');
  fs.mkdirSync(destination, { recursive: true });
  for (const name of fs.readdirSync(macOutput)) {
    if (!/\.(?:dmg|zip|blockmap)$/.test(name)) continue;
    fs.copyFileSync(path.join(macOutput, name), path.join(destination, name));
  }
  fs.rmSync(macOutput, { recursive: true, force: true });
}
