'use strict';
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const router = path.join(root, 'native', 'subscription-lens-router');
const runtime = path.join(root, 'native', 'cc-switch-runtime');
const runtimePatch = path.join(root, 'native', 'cc-switch-patches', '0001-codex-alias-mapping.patch');
const isWindows = process.platform === 'win32';
const executableName = `subscription-lens-router${isWindows ? '.exe' : ''}`;
const output = path.join(root, 'assets', 'router', executableName);
const vcvars = 'C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Auxiliary\\Build\\vcvars64.bat';
if (!fs.existsSync(runtimePatch)) throw new Error('Embedded CC Switch patch is missing.');
if (process.platform === 'darwin' && process.arch !== 'arm64') throw new Error('The macOS router supports Apple Silicon only.');
let appliedHere = false;
try {
  try {
    execFileSync('git', ['apply', '--check', runtimePatch], { cwd: runtime, stdio: 'ignore' });
    execFileSync('git', ['apply', runtimePatch], { cwd: runtime, stdio: 'inherit' });
    appliedHere = true;
  } catch {
    execFileSync('git', ['apply', '--reverse', '--check', runtimePatch], { cwd: runtime, stdio: 'ignore' });
  }
  if (isWindows) {
    execFileSync('cmd.exe', ['/d', '/s', '/c', `call "${vcvars}" >nul && set "PATH=%USERPROFILE%\\.cargo\\bin;%PATH%" && cargo build --release`], { cwd: router, stdio: 'inherit' });
  } else {
    execFileSync(process.env.CARGO || 'cargo', ['build', '--release'], { cwd: router, stdio: 'inherit' });
  }
} finally {
  if (appliedHere) execFileSync('git', ['apply', '--reverse', runtimePatch], { cwd: runtime, stdio: 'inherit' });
}
const binary = path.join(router, 'target', 'release', executableName);
if (!fs.existsSync(binary)) throw new Error('Embedded CC Switch router build completed without an executable.');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.copyFileSync(binary, output);
if (!isWindows) fs.chmodSync(output, 0o755);
process.stdout.write(`Embedded CC Switch router staged: ${output}\n`);
