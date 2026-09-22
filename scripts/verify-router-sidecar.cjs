/* Verify that the packaged headless CC Switch router can safely answer status
 * while its own state and its fake Codex directory remain isolated. */
const { spawn } = require('node:child_process');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const executable = path.resolve(__dirname, '..', 'assets', 'router', `subscription-lens-router${process.platform === 'win32' ? '.exe' : ''}`);
if (!fs.existsSync(executable)) throw new Error(`CC Switch router runtime is missing: ${executable}`);
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'subscription-lens-router-check-'));
const codexHome = path.join(home, 'fake-codex');
fs.mkdirSync(path.join(home, '.cc-switch'), { recursive: true }); fs.mkdirSync(codexHome, { recursive: true });
fs.writeFileSync(path.join(home, '.cc-switch', 'settings.json'), JSON.stringify({ codexConfigDir: codexHome }));
const child = spawn(executable, [], { env: { ...process.env, CC_SWITCH_TEST_HOME: home, SUBSCRIPTION_LENS_ROUTER_DATA: path.join(home, '.cc-switch') }, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
let stdout = '', stderr = '', settled = false;
function finish(error) { if (settled) return; settled = true; clearTimeout(timeout); try { fs.rmSync(home, { recursive: true, force: true }); } catch {} if (error) { console.error(error.message); process.exitCode = 1; } }
child.on('error', error => finish(new Error(`CC Switch router could not start: ${error.message}`)));
child.stdout.on('data', chunk => { stdout += chunk; const line = stdout.split(/\r?\n/)[0]; if (!line) return; try { const reply = JSON.parse(line); if (reply.ok) { child.stdin.end(JSON.stringify({ command: 'shutdown' }) + '\n'); finish(); } else finish(new Error(`CC Switch router rejected status: ${reply.error || line}`)); } catch { finish(new Error(`CC Switch router returned invalid status: ${line}`)); } });
child.stderr.on('data', chunk => { stderr += chunk; });
child.on('exit', (code, signal) => { if (!settled) finish(new Error(`CC Switch router exited before status (code ${code}, signal ${signal}). ${stderr}`)); });
const timeout = setTimeout(() => { child.kill(); finish(new Error('CC Switch router did not answer status within 10 seconds.')); }, 10_000);
child.stdin.write(JSON.stringify({ command: 'status' }) + '\n');
