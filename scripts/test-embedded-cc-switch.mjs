import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'sublens-ccs-integration-'));
const codex = path.join(root, 'codex');
await fs.mkdir(codex, { recursive: true });
await fs.writeFile(path.join(codex, 'config.toml'), 'model = "gpt-5.6-sol"\nmodel_provider = "openai"\n');
const officialAuth = JSON.stringify({
  auth_mode: 'chatgpt',
  tokens: {
    access_token: 'official-access-token',
    refresh_token: 'official-refresh-token',
    id_token: 'official-id-token',
    account_id: 'official-account',
  },
});
await fs.writeFile(path.join(codex, 'auth.json'), officialAuth);
await fs.mkdir(path.join(root, '.cc-switch'), { recursive: true });
await fs.writeFile(path.join(root, '.cc-switch', 'settings.json'), JSON.stringify({ codexConfigDir: codex }));

const child = spawn(path.resolve('assets/router/subscription-lens-router.exe'), [], {
  env: { ...process.env, CC_SWITCH_TEST_HOME: root, SUBSCRIPTION_LENS_ROUTER_DATA: path.join(root, '.cc-switch') },
  stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true,
});
let buffer = ''; const pending = []; let stderr = '';
child.stdout.setEncoding('utf8');
child.stdout.on('data', chunk => { buffer += chunk; for (;;) { const at = buffer.indexOf('\n'); if (at < 0) break; const line = buffer.slice(0, at); buffer = buffer.slice(at + 1); const p = pending.shift(); if (p && line.trim()) { const reply = JSON.parse(line); reply.ok ? p.resolve(reply.value) : p.reject(Error(reply.error)); } } });
child.stderr.on('data', value => { stderr += value; });
function call(command) { return new Promise((resolve, reject) => { pending.push({ resolve, reject }); child.stdin.write(JSON.stringify(command) + '\n'); }); }

try {
  await call({ command: 'status' });
  await call({ command: 'activateCodexProvider', providerId: 'deepseek-a', name: 'DeepSeek A', baseUrl: 'https://api.deepseek.example/v1', apiKey: 'test-key', upstreamModel: 'deepseek-flash', modelMappings: [{ alias: 'gpt-5.6-sol', upstream: 'deepseek-flash' }, { alias: 'gpt-5.6-terra', upstream: 'deepseek-v4-pro' }], protocol: 'responses' });
  const preservedDuringThirdParty = await fs.readFile(path.join(codex, 'auth.json'), 'utf8');
  if (preservedDuringThirdParty !== officialAuth) throw Error('third-party activation changed or removed the native OpenAI login');
  const taken = await fs.readFile(path.join(codex, 'config.toml'), 'utf8');
  if (!taken.includes('127.0.0.1')) throw Error('takeover config missing local proxy: ' + taken);
  if (!taken.includes('model_provider = "subscription-lens-deepseek-a"') || !taken.includes('[model_providers.subscription-lens-deepseek-a]')) throw Error('takeover config is missing its active provider table: ' + taken);
  if (/\[model_providers\.subscription-lens-deepseek-a\][\s\S]*?name\s*=\s*"OpenAI"/.test(taken)) throw Error('third-party takeover unexpectedly enables remote compaction: ' + taken);
  const catalog = JSON.parse(await fs.readFile(path.join(codex, 'cc-switch-model-catalog.json'), 'utf8'));
  const modelIds = new Set((catalog.models || []).map(model => model.slug || model.model).filter(Boolean));
  if (!modelIds.has('gpt-5.6-sol') || !modelIds.has('gpt-5.6-terra') || modelIds.has('deepseek-flash')) throw Error('ChatGPT-safe model catalog missing: ' + JSON.stringify([...modelIds]));
  await call({ command: 'activateCodexProvider', providerId: 'deepseek-b', name: 'DeepSeek B', baseUrl: 'https://api.deepseek.example/v1', apiKey: 'test-key', upstreamModel: 'deepseek-v4-pro', protocol: 'responses' });
  const hot = await fs.readFile(path.join(codex, 'config.toml'), 'utf8');
  if (!hot.includes('127.0.0.1')) throw Error('hot switch removed local takeover');
  if (!hot.includes('model_provider = "subscription-lens-deepseek-b"') || !hot.includes('[model_providers.subscription-lens-deepseek-b]')) throw Error('hot switch is missing its active provider table: ' + hot);
  if (/\[model_providers\.subscription-lens-deepseek-b\][\s\S]*?name\s*=\s*"OpenAI"/.test(hot)) throw Error('hot switch unexpectedly enables remote compaction: ' + hot);
  await call({ command: 'activateCodexOfficial' });
  const preservedAfterOfficialRestore = await fs.readFile(path.join(codex, 'auth.json'), 'utf8');
  if (preservedAfterOfficialRestore !== officialAuth) throw Error('official restore changed or removed the native OpenAI login');
  const restored = await fs.readFile(path.join(codex, 'config.toml'), 'utf8');
  if (restored.includes('127.0.0.1')) throw Error('official switch left the local proxy active');
  if (restored.includes('model_catalog_json') || restored.includes('subscription-lens-')) throw Error('official switch did not restore the official model catalog: ' + restored);
  if (/model_provider\s*=/.test(restored) && !/model_provider\s*=\s*"openai"/.test(restored)) throw Error('official switch did not select OpenAI: ' + restored);
  console.log('embedded CC Switch takeover / hot switch / official restore: passed');
  child.stdin.end(JSON.stringify({ command: 'shutdown' }) + '\n');
} catch (error) {
  console.error(error.stack); console.error(stderr); child.kill(); process.exitCode = 1;
} finally {
  await new Promise(resolve => child.once('exit', resolve));
  await fs.rm(root, { recursive: true, force: true });
}

