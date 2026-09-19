'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { Store } = require('../src/core/store.cjs');
const { ProviderManager, writeProviderConfig } = require('../src/core/providers.cjs');

test('Codex provider config keeps official provider identity and writes custom providers', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sublens-provider-test-'));
  try {
    const store = new Store(dir); const home = path.join(dir, '.codex');
    const manager = new ProviderManager({ store, getCodexHome: () => home, dataDir: dir });
    const custom = manager.save({ name: 'DeepSeek', model: 'deepseek-chat', baseUrl: 'https://api.deepseek.com/v1', envKey: 'DEEPSEEK_API_KEY' });
    const result = await manager.activate(custom.id);
    const text = fs.readFileSync(result.configPath, 'utf8');
    assert.match(text, /model_provider = "deepseek"/);
    assert.match(text, /\[model_providers\.deepseek\]/);
    assert.match(text, /env_key = "DEEPSEEK_API_KEY"/);
    fs.writeFileSync(result.configPath, 'model = "deepseek-flash"\nmodel_provider = "subscription_lens"\nmodel_catalog_json = "cc-switch-model-catalog.json"\n\n[model_providers.subscription_lens]\nbase_url = "https://api.deepseek.com/v1"\nexperimental_bearer_token = "test-only"\n', 'utf8');
    const official = await manager.activate('openai-official');
    const officialText = fs.readFileSync(official.configPath, 'utf8');
    assert.match(officialText, /model_provider = "openai"/);
    assert.doesNotMatch(officialText, /env_key = "OPENAI_API_KEY"/);
    assert.doesNotMatch(officialText, /subscription_lens|experimental_bearer_token|cc-switch-model-catalog/);
    assert.equal(fs.readdirSync(path.join(dir, 'codex-config-backups')).length, 1);
    const chat = manager.save({ name: 'ChatOnly', model: 'chat-model', baseUrl: 'https://example.com/v1', envKey: 'CHAT_KEY', protocol: 'chat' });
    await assert.rejects(() => manager.activate(chat.id), /兼容适配/);
    store.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('provider config patch preserves unrelated Codex settings', () => {
  const text = writeProviderConfig('approval_policy = "never"\n\n[profiles.default]\nmodel = "old"\n', { id: 'demo', name: 'Demo', baseUrl: 'https://example.com/v1', model: 'demo', protocol: 'responses', envKey: 'DEMO_KEY', builtIn: false, kind: 'custom' });
  assert.match(text, /approval_policy = "never"/);
  assert.match(text, /\[profiles\.default\]/);
  assert.match(text, /\[model_providers\.demo\]/);
});

test('all non-official provider families retain their own provider identity', () => {
  for (const name of ['DeepSeek', 'Qwen', 'Kimi', 'OpenRouter', 'Custom gateway']) {
    const text = writeProviderConfig('', {
      id: name.toLowerCase().replace(/\\s+/g, '-'), name,
      baseUrl: 'https://example.com/v1', model: 'upstream-model',
      protocol: 'responses', envKey: 'PROVIDER_API_KEY', builtIn: false, kind: 'custom'
    });
    assert.match(text, /requires_openai_auth = false/);
    assert.match(text, new RegExp(`name = "${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    assert.doesNotMatch(text, /name = "OpenAI"/);
  }
});

test('third-party providers cannot accidentally enable CCS remote compaction', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sublens-provider-name-'));
  try {
    const store = new Store(dir);
    const manager = new ProviderManager({ store, getCodexHome: () => path.join(dir, '.codex'), dataDir: dir });
    assert.throws(() => manager.save({ name: 'OpenAI', baseUrl: 'https://example.com/v1', model: 'gateway-model' }), /不能为 OpenAI/);
    store.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('official restore keeps a user-managed model catalog', () => {
  const text = writeProviderConfig('model_catalog_json = "my-catalog.json"\nmodel_provider = "subscription_lens"\n\n[model_providers.subscription_lens]\nexperimental_bearer_token = "test-only"\n', { ...require('../src/core/providers.cjs').builtin });
  assert.match(text, /model_catalog_json = "my-catalog.json"/);
  assert.doesNotMatch(text, /subscription_lens|experimental_bearer_token/);
});

test('official activation removes a stale embedded route without touching auth', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sublens-provider-restore-'));
  try {
    const store = new Store(dir); const home = path.join(dir, '.codex');
    fs.mkdirSync(home, { recursive: true });
    fs.writeFileSync(path.join(home, 'config.toml'), 'model_provider = "subscription-lens-deepseek"\nmodel = "gpt-5.6-sol"\nmodel_catalog_json = "cc-switch-model-catalog.json"\n\n[model_providers.subscription-lens-deepseek]\nname = "DeepSeek"\nbase_url = "http://127.0.0.1:15721/v1"\n', 'utf8');
    const auth = '{"auth_mode":"chatgpt","tokens":{"marker":"preserve-me"}}\n';
    fs.writeFileSync(path.join(home, 'auth.json'), auth, 'utf8');
    const manager = new ProviderManager({ store, getCodexHome: () => home, dataDir: dir });
    await manager.activate('openai-official');
    const config = fs.readFileSync(path.join(home, 'config.toml'), 'utf8');
    assert.match(config, /model_provider = "openai"/);
    assert.doesNotMatch(config, /model_catalog_json/);
    assert.equal(fs.readFileSync(path.join(home, 'auth.json'), 'utf8'), auth);
    store.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('official route cleanup removes a stranded Lens catalog without changing user config', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sublens-official-cleanup-'));
  try {
    const store = new Store(dir); const home = path.join(dir, '.codex'); fs.mkdirSync(home);
    const original = 'notify = ["turn-ended"]\nmodel_catalog_json = "cc-switch-model-catalog.json"\n\n[desktop]\nfollowUpQueueMode = "queue"\n';
    fs.writeFileSync(path.join(home, 'config.toml'), original, 'utf8');
    const manager = new ProviderManager({ store, getCodexHome: () => home, dataDir: dir });
    const result = await manager.cleanupOfficialRoute();
    const config = fs.readFileSync(path.join(home, 'config.toml'), 'utf8');
    assert.equal(result.changed, true);
    assert.doesNotMatch(config, /cc-switch-model-catalog/);
    assert.match(config, /notify = \["turn-ended"\]/);
    assert.match(config, /followUpQueueMode = "queue"/);
    assert.ok(result.backup && fs.existsSync(result.backup));
    store.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('official Codex login is not probed as an API-key models endpoint', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sublens-provider-official-'));
  try {
    const store = new Store(dir); const home = path.join(dir, '.codex');
    fs.mkdirSync(home, { recursive: true });
    fs.writeFileSync(path.join(home, 'config.toml'), 'model_provider = "custom"\nmodel = "gpt-5.6-sol"\n\n[model_providers.custom]\nbase_url = "https://api.openai.com/v1"\n', 'utf8');
    const manager = new ProviderManager({ store, getCodexHome: () => home, dataDir: dir });
    const imported = await manager.importCurrent();
    assert.equal(imported.id, 'openai-official');
    assert.equal(manager.list().find(p => p.id === 'openai-official').authMode, 'codex');
    const result = await manager.test(imported.id);
    assert.equal(result.ok, true); assert.equal(result.skipped, true);
    store.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('provider API keys use the encrypted app vault and never appear in profiles', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sublens-provider-vault-'));
  try {
    const store = new Store(dir); const vault = { isAvailable: () => true, encrypt: value => `sealed:${value}`, decrypt: value => value.replace(/^sealed:/, '') };
    const manager = new ProviderManager({ store, getCodexHome: () => path.join(dir, '.codex'), dataDir: dir, credentialVault: vault });
    const provider = manager.save({ name: 'Gateway', model: 'gateway-model', baseUrl: 'https://gateway.example/v1', envKey: 'GATEWAY_KEY', apiKey: 'secret-value' });
    assert.doesNotMatch(JSON.stringify(provider), /secret-value/);
    assert.equal(store.get('providerSecrets').gateway, 'sealed:secret-value');
    assert.equal(manager.resolveCredential(manager.get('gateway')), 'secret-value');
    assert.equal(manager.list().find(p => p.id === 'gateway').credentialSource, 'app');
    store.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('provider model discovery uses an entered key without persisting it', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sublens-provider-discover-'));
  const server = http.createServer((request, response) => {
    assert.equal(request.url, '/v1/models');
    assert.equal(request.headers.authorization, 'Bearer temporary-key');
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ data: [{ id: 'deepseek-v4-flash' }, { id: 'deepseek-v4-pro' }] }));
  });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address(); const store = new Store(dir);
    const manager = new ProviderManager({ store, getCodexHome: () => path.join(dir, '.codex'), dataDir: dir });
    const result = await manager.discover({ baseUrl: `http://127.0.0.1:${port}/v1`, apiKey: 'temporary-key' });
    assert.equal(result.ok, true); assert.deepEqual(result.models, ['deepseek-v4-flash', 'deepseek-v4-pro']);
    assert.doesNotMatch(JSON.stringify(store.get('providerSecrets', {})), /temporary-key/);
    store.close();
  } finally { await new Promise(resolve => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('provider model discovery reuses the encrypted credential after editing', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sublens-provider-discover-saved-'));
  const vault = { isAvailable: () => true, encrypt: value => `sealed:${value}`, decrypt: value => value.replace(/^sealed:/, '') };
  const server = http.createServer((request, response) => {
    assert.equal(request.url, '/v1/models');
    assert.equal(request.headers.authorization, 'Bearer saved-key');
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ data: [{ id: 'deepseek-v4-flash' }] }));
  });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address(); const store = new Store(dir);
    const manager = new ProviderManager({ store, getCodexHome: () => path.join(dir, '.codex'), dataDir: dir, credentialVault: vault });
    const provider = manager.save({ name: 'DeepSeek', model: 'deepseek-v4-flash', baseUrl: `http://127.0.0.1:${port}/v1`, envKey: 'DEEPSEEK_API_KEY', apiKey: 'saved-key' });
    const result = await manager.discover({ id: provider.id, baseUrl: provider.baseUrl });
    assert.equal(result.ok, true); assert.deepEqual(result.models, ['deepseek-v4-flash']);
    assert.doesNotMatch(JSON.stringify(result), /saved-key/);
    store.close();
  } finally { await new Promise(resolve => server.close(resolve)); fs.rmSync(dir, { recursive: true, force: true }); }
});

test('provider keeps a deduplicated Codex model catalog including its default', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sublens-provider-catalog-'));
  try {
    const store = new Store(dir);
    const manager = new ProviderManager({ store, getCodexHome: () => path.join(dir, '.codex'), dataDir: dir });
    const provider = manager.save({ name: 'DeepSeek', model: 'deepseek-v4-flash', modelCatalog: ['deepseek-v4-pro', 'deepseek-v4-flash', ''], baseUrl: 'https://api.deepseek.com/v1', envKey: 'DEEPSEEK_API_KEY' });
    assert.deepEqual(provider.modelCatalog, ['deepseek-v4-flash', 'deepseek-v4-pro']);
    assert.doesNotMatch(JSON.stringify(provider), /temporary-key/);
    store.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('provider stores explicit compatible-Codex aliases for upstream model mappings', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sublens-provider-mapping-'));
  try {
    const store = new Store(dir);
    const manager = new ProviderManager({ store, getCodexHome: () => path.join(dir, '.codex'), dataDir: dir });
    const provider = manager.save({ name: 'Gateway', model: 'model-fast', baseUrl: 'https://gateway.example/v1', envKey: 'GATEWAY_KEY', modelMappings: [{ alias: 'gpt-5.6-sol', upstream: 'model-fast' }, { alias: 'gpt-5.6-terra', upstream: 'model-pro' }] });
    assert.deepEqual(provider.modelMappings, [{ alias: 'gpt-5.6-sol', upstream: 'model-fast' }, { alias: 'gpt-5.6-terra', upstream: 'model-pro' }]);
    assert.throws(() => manager.save({ name: 'Duplicate', model: 'model', baseUrl: 'https://duplicate.example/v1', envKey: 'DUPLICATE_KEY', modelMappings: [{ alias: 'gpt-5.6-sol', upstream: 'a' }, { alias: 'gpt-5.6-sol', upstream: 'b' }] }), /无效或重复/);
    store.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('proxy activation fails closed and never rewrites Codex config', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sublens-provider-switch-'));
  try {
    const store = new Store(dir); const home = path.join(dir, '.codex'); fs.mkdirSync(home, { recursive: true });
    fs.writeFileSync(path.join(home, 'config.toml'), 'model_provider = "subscription-lens-router"\n\n[model_providers.subscription-lens-router]\nbase_url = "http://127.0.0.1:15731/v1"\n', 'utf8');
    const manager = new ProviderManager({ store, getCodexHome: () => home, dataDir: dir });
    const provider = manager.save({ name: 'Gateway', model: 'gateway-model', baseUrl: 'https://gateway.example/v1', envKey: 'GATEWAY_KEY' });
    const before = fs.readFileSync(path.join(home, 'config.toml'), 'utf8');
    await assert.rejects(() => manager.activateViaProxy(provider.id, 15731), /CC Switch 运行时/);
    assert.equal(await manager.isRouterConfigured(15731), false);
    assert.equal(store.get('activeProviderId'), null);
    assert.match(fs.readFileSync(path.join(home, 'config.toml'), 'utf8'), /subscription-lens-router/);
    assert.equal(fs.readFileSync(path.join(home, 'config.toml'), 'utf8'), before);
    store.close();
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
