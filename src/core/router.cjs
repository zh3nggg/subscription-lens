'use strict';

const http = require('node:http');
const { EventEmitter } = require('node:events');
const fsp = require('node:fs').promises;
const path = require('node:path');
const crypto = require('node:crypto');

class LocalRouter extends EventEmitter {
  constructor({ providerManager, dataDir }) { super(); this.providerManager = providerManager; this.dataDir = dataDir; this.server = null; this.port = null; this.startedAt = null; this.logPath = path.join(dataDir, 'router-usage.jsonl'); }
  status() { return { running: Boolean(this.server), host: '127.0.0.1', port: this.port, startedAt: this.startedAt, logPath: this.logPath, providerId: this.providerManager.activeId || null }; }
  async start(port = 0) {
    // Do not expose an app-lifetime server as a durable Codex route.  The
    // CC Switch runtime will replace this experimental monitor-only server.
    if (this.providerManager?.getCodexHome) throw new Error('本地路由正在迁移到 CC Switch 运行时；当前版本不会启动可能影响 Codex 重启的代理。');
    if (this.server) return this.status();
    await fsp.mkdir(this.dataDir, { recursive: true });
    await fsp.appendFile(this.logPath, '', 'utf8');
    this.server = http.createServer((req, res) => this.handle(req, res));
    await new Promise((resolve, reject) => { this.server.once('error', reject); this.server.listen({ host: '127.0.0.1', port: Number(port) || 15731 }, resolve); });
    this.port = this.server.address().port; this.startedAt = new Date().toISOString(); this.emit('changed'); return this.status();
  }
  async stop() { if (!this.server) return false; this.server.closeAllConnections?.(); await new Promise(resolve => this.server.close(() => resolve())); this.server = null; this.port = null; this.startedAt = null; this.emit('changed'); return true; }
  async handle(req, res) {
    try {
      if (req.method === 'GET' && req.url === '/health') return this.json(res, 200, { ok: true, ...this.status() });
      const provider = this.providerManager.activeId && this.providerManager.get(this.providerManager.activeId);
      if (!provider) return this.json(res, 503, { error: { message: 'No active provider' } });
      const key = this.providerManager.resolveCredential(provider);
      if (!key && provider.kind !== 'official') return this.json(res, 401, { error: { message: `Missing environment variable ${provider.envKey}` } });
      const incoming = new URL(req.url || '/', 'http://127.0.0.1');
      if (req.method === 'GET' && incoming.pathname.endsWith('/models')) return this.forward(req, res, provider, key, null);
      if (!['POST', 'GET'].includes(req.method) || !['/v1/responses', '/responses', '/v1/chat/completions', '/chat/completions'].includes(incoming.pathname)) return this.json(res, 404, { error: { message: 'Unsupported router path' } });
      const body = req.method === 'GET' ? null : await this.readBody(req); return this.forward(req, res, provider, key, body);
    } catch (error) { if (!res.headersSent) this.json(res, 502, { error: { message: error.message || 'Router error' } }); else res.destroy(); }
  }
  async forward(req, res, provider, key, body) {
    const base = provider.baseUrl.replace(/\/$/, ''); const incoming = new URL(req.url || '/', 'http://127.0.0.1');
    let upstreamPath = incoming.pathname.startsWith('/v1') ? incoming.pathname : `/v1${incoming.pathname}`;
    if (base.endsWith('/v1') && upstreamPath.startsWith('/v1')) upstreamPath = upstreamPath.slice(3) || '/';
    const upstream = new URL(`${base}${upstreamPath}${incoming.search}`);
    const headers = { accept: req.headers.accept || 'application/json' }; if (body) headers['content-type'] = req.headers['content-type'] || 'application/json'; if (key) headers.authorization = `Bearer ${key}`;
    const response = await fetch(upstream, { method: req.method, headers, body: body || undefined, signal: AbortSignal.timeout(120000) });
    res.statusCode = response.status; for (const [name, value] of response.headers) if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(name.toLowerCase())) res.setHeader(name, value);
    let stream = false; try { stream = Boolean(body && JSON.parse(body.toString('utf8')).stream); } catch { /* Non-JSON requests are forwarded without usage inspection. */ }
    if (stream && response.body) { await require('node:stream').Readable.fromWeb(response.body).pipe(res); return; }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (body && response.ok) await this.record(req, provider, body, bytes);
    res.setHeader('content-length', bytes.length); res.end(bytes);
  }
  async record(req, provider, requestBody, responseBody) {
    let request = null, response = null; try { request = JSON.parse(requestBody.toString('utf8')); response = JSON.parse(responseBody.toString('utf8')); } catch { return; }
    const usage = response?.usage; if (!usage) return;
    const input = Number(usage.input_tokens ?? usage.prompt_tokens ?? 0), output = Number(usage.output_tokens ?? usage.completion_tokens ?? 0), cached = Number(usage.input_tokens_details?.cached_tokens ?? usage.prompt_tokens_details?.cached_tokens ?? 0);
    if (![input, output, cached].every(n => Number.isSafeInteger(n) && n >= 0)) return;
    const event = { schema: 'subscription-lens.usage.v1', id: `router-${crypto.randomUUID()}`, at: new Date().toISOString(), provider: provider.name, model: response.model || request.model || provider.model, session: 'router', project: 'Codex Router', usage: { input, cached, write: 0, output, reasoning: Number(usage.output_tokens_details?.reasoning_tokens ?? 0) }, cost: { usd: null, basis: 'estimate' }, status: 200, origin: 'local-router' };
    await fsp.appendFile(this.logPath, JSON.stringify(event) + '\n', 'utf8'); this.emit('usage', event);
  }
  readBody(req) { return new Promise((resolve, reject) => { const chunks = []; let size = 0; req.on('data', chunk => { size += chunk.length; if (size > 16 * 1024 * 1024) { reject(new Error('请求过大')); req.destroy(); } else chunks.push(chunk); }); req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject); }); }
  json(res, status, value) { const body = Buffer.from(JSON.stringify(value)); res.writeHead(status, { 'content-type': 'application/json', 'content-length': body.length }); res.end(body); }
}

module.exports = { LocalRouter };
