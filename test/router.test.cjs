'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ProviderManager } = require('../src/core/providers.cjs');
const { LocalRouter } = require('../src/core/router.cjs');
const { Store } = require('../src/core/store.cjs');

test('experimental local router fails closed before it can become a Codex startup dependency', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sublens-router-test-'));
  const upstream = http.createServer((req, res) => {
    if (req.url === '/v1/models') return res.end(JSON.stringify({ data: [{ id: 'demo' }] }));
    let body = ''; req.on('data', chunk => { body += chunk; }); req.on('end', () => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ model: 'demo', usage: { input_tokens: 3, output_tokens: 2 } })); });
  });
  try {
    await new Promise(resolve => upstream.listen(0, '127.0.0.1', resolve));
    process.env.SUBLENS_ROUTER_KEY = 'test';
    const store = new Store(dir); const manager = new ProviderManager({ store, getCodexHome: () => path.join(dir, '.codex'), dataDir: dir });
    const provider = manager.save({ name: 'Local', model: 'demo', baseUrl: `http://127.0.0.1:${upstream.address().port}/v1`, envKey: 'SUBLENS_ROUTER_KEY' }); manager.activeId = provider.id;
    const router = new LocalRouter({ providerManager: manager, dataDir: dir });
    await assert.rejects(() => router.start(), /CC Switch 运行时/);
    assert.equal(router.status().running, false);
    assert.equal(fs.existsSync(router.logPath), false);
    store.close();
  } finally { delete process.env.SUBLENS_ROUTER_KEY; upstream.close(); fs.rmSync(dir, { recursive: true, force: true }); }
});
