'use strict';

const { spawn } = require('node:child_process');
const { EventEmitter } = require('node:events');
const fs = require('node:fs/promises');
const path = require('node:path');

class CCSwitchSidecar extends EventEmitter {
  constructor(binaryPath, { codexHome, runtimeHome } = {}) {
    super();
    this.binaryPath = binaryPath;
    this.codexHome = codexHome;
    this.runtimeHome = runtimeHome;
    this.child = null;
    this.buffer = '';
    this.pending = [];
  }

  status() {
    return { embedded: true, running: Boolean(this.child && !this.child.killed), binaryPath: this.binaryPath };
  }

  async prepareRuntime() {
    if (!this.codexHome || !this.runtimeHome) throw Error('嵌入式路由尚未初始化');
    const settingsPath = path.join(this.runtimeHome, '.cc-switch', 'settings.json');
    await fs.mkdir(path.dirname(settingsPath), { recursive: true });
    // CC Switch resolves the real Codex directory from this setting. The
    // temporary HOME below therefore isolates its own database/settings while
    // never redirecting the user's actual Codex home.
    await fs.writeFile(settingsPath, JSON.stringify({ codexConfigDir: this.codexHome }, null, 2), 'utf8');
  }

  async start() {
    if (this.child && !this.child.killed) return this.status();
    await this.prepareRuntime();
    this.child = spawn(this.binaryPath, [], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        CC_SWITCH_TEST_HOME: this.runtimeHome,
        SUBSCRIPTION_LENS_ROUTER_DATA: path.join(this.runtimeHome, '.cc-switch'),
      },
    });
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', data => this.read(data));
    this.child.stderr.on('data', data => this.emit('diagnostic', String(data).slice(0, 1000)));
    this.child.once('exit', (code, signal) => {
      const error = Error(`Embedded router stopped (${code ?? signal ?? 'unknown'}).`);
      while (this.pending.length) this.pending.shift().reject(error);
      this.child = null;
      this.emit('changed');
    });
    await new Promise((resolve, reject) => { this.child.once('spawn', resolve); this.child.once('error', reject); });
    await this.request({ command: 'status' });
    this.emit('changed');
    return this.status();
  }

  read(data) {
    this.buffer += data;
    for (;;) {
      const index = this.buffer.indexOf('\n');
      if (index < 0) break;
      const line = this.buffer.slice(0, index); this.buffer = this.buffer.slice(index + 1);
      const next = this.pending.shift();
      if (!next || !line.trim()) continue;
      try { const reply = JSON.parse(line); reply.ok ? next.resolve(reply.value) : next.reject(Error(reply.error || 'Embedded router request failed.')); }
      catch (error) { next.reject(error); }
    }
  }

  request(command, timeoutMs = 30_000) {
    if (!this.child || this.child.killed) return Promise.reject(Error('Embedded router is not running.'));
    return new Promise((resolve, reject) => {
      const pending = { resolve, reject, timer: null };
      pending.timer = setTimeout(() => {
        const index = this.pending.indexOf(pending);
        if (index >= 0) this.pending.splice(index, 1);
        reject(Error('嵌入式路由未在预期时间内响应'));
      }, timeoutMs);
      const finish = (fn, value) => { clearTimeout(pending.timer); fn(value); };
      pending.resolve = value => finish(resolve, value);
      pending.reject = error => finish(reject, error);
      this.pending.push(pending);
      this.child.stdin.write(JSON.stringify(command) + '\n', error => {
        if (!error) return;
        const index = this.pending.indexOf(pending);
        if (index >= 0) this.pending.splice(index, 1);
        pending.reject(error);
      });
    });
  }

  async stopAndRestore() {
    if (!this.child || this.child.killed) return false;
    try { await this.request({ command: 'shutdown' }, 15_000); }
    finally {
      const child = this.child;
      await new Promise(resolve => child.once('exit', resolve));
      if (this.child === child && !child.killed) child.kill();
    }
    return true;
  }
}

function defaultSidecarPath(appRoot, packaged) {
  return packaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', 'router', 'subscription-lens-router.exe')
    : path.join(appRoot, 'native', 'subscription-lens-router', 'target', 'release', 'subscription-lens-router.exe');
}
module.exports = { CCSwitchSidecar, defaultSidecarPath };
