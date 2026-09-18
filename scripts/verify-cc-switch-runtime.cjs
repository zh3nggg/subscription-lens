'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..', 'native', 'cc-switch-runtime');
const host = path.resolve(__dirname, '..', 'native', 'subscription-lens-router');
const core = path.resolve(__dirname, '..', 'native', 'cc-switch-router-core');
const revision = '06082e189d65e6d6dbadc35dacdac1ce6c79d89a';
const required = ['LICENSE', 'src-tauri/src/services/proxy.rs', 'src-tauri/src/codex_config.rs', 'src-tauri/src/proxy/server.rs'];

if (!fs.existsSync(root)) throw new Error('CC Switch runtime submodule is missing; run git submodule update --init --recursive.');
const actual = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (actual !== revision) throw new Error(`CC Switch runtime must be pinned to ${revision}; found ${actual}.`);
for (const file of required) if (!fs.existsSync(path.join(root, file))) throw new Error(`CC Switch runtime is incomplete: ${file}`);
const license = fs.readFileSync(path.join(root, 'LICENSE'), 'utf8');
if (!license.includes('MIT License') || !license.includes('Jason Young')) throw new Error('CC Switch MIT notice is missing.');
const manifest = fs.readFileSync(path.join(host, 'Cargo.toml'), 'utf8');
const coreSource = fs.readFileSync(path.join(core, 'src', 'lib.rs'), 'utf8');
const source = fs.readFileSync(path.join(host, 'src', 'main.rs'), 'utf8');
if (!manifest.includes('cc-switch-router-core')) throw new Error('Embedded router host is not linked to the headless CC Switch core.');
for (const upstreamPath of ['services/mod.rs', 'proxy/mod.rs', 'codex_config.rs', 'provider.rs']) {
  if (!coreSource.includes(upstreamPath)) throw new Error(`Headless CC Switch core is missing upstream ${upstreamPath}.`);
}
for (const requiredCommand of ['ActivateCodexProvider', 'StopAndRestore', 'ProviderService::switch', 'set_takeover_for_app']) {
  if (!source.includes(requiredCommand)) throw new Error(`Embedded router host is missing ${requiredCommand}.`);
}
process.stdout.write(`CC Switch runtime verified: ${actual}\n`);
