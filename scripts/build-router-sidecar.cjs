'use strict';
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const router = path.join(root, 'native', 'subscription-lens-router');
const runtime = path.join(root, 'native', 'cc-switch-runtime');
const runtimePatch = path.join(root, 'native', 'cc-switch-patches', '0001-codex-alias-mapping.patch');
const output = path.join(root, 'assets', 'router', 'subscription-lens-router.exe');
const vcvars = 'C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Auxiliary\\Build\\vcvars64.bat';
if (!fs.existsSync(runtimePatch)) throw new Error('Embedded CC Switch patch is missing.');
let appliedHere = false;
try {
  try {
    execSync(`git apply --check "${runtimePatch}"`, { cwd: runtime, stdio: 'ignore' });
    execSync(`git apply "${runtimePatch}"`, { cwd: runtime, stdio: 'inherit' });
    appliedHere = true;
  } catch {
    execSync(`git apply --reverse --check "${runtimePatch}"`, { cwd: runtime, stdio: 'ignore' });
  }
  execSync(`call "${vcvars}" >nul && set "PATH=%USERPROFILE%\\.cargo\\bin;%PATH%" && cargo build --release`, { cwd: router, stdio: 'inherit', shell: 'cmd.exe' });
} finally {
  if (appliedHere) execSync(`git apply --reverse "${runtimePatch}"`, { cwd: runtime, stdio: 'inherit' });
}
const binary = path.join(router, 'target', 'release', 'subscription-lens-router.exe');
if (!fs.existsSync(binary)) throw new Error('Embedded CC Switch router build completed without an executable.');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.copyFileSync(binary, output);
process.stdout.write(`Embedded CC Switch router staged: ${output}\n`);
