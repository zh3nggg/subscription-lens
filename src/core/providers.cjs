'use strict';

const fs = require('node:fs');
const fsp = fs.promises;
const path = require('node:path');
const crypto = require('node:crypto');

const ID_RE = /^[a-z0-9][a-z0-9_-]{0,48}$/;
const ENV_RE = /^[A-Z_][A-Z0-9_]{1,127}$/;
const CODEX_COMPATIBLE_ALIASES = ['gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-6-astra', 'gpt-5.5'];

const builtin = {
  id: 'openai-official', name: 'OpenAI Official', kind: 'official',
  baseUrl: 'https://api.openai.com/v1', model: 'gpt-5', protocol: 'responses',
  envKey: 'OPENAI_API_KEY', enabled: true, builtIn: true,
  pricing: 'catalog', capabilities: { responses: true, streaming: true, tools: true, reasoning: true }
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function safeId(value) { const id = String(value || '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, ''); return id.slice(0, 49) || `provider-${crypto.randomBytes(3).toString('hex')}`; }
function validUrl(value) { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && (u.protocol === 'https:' || ['localhost', '127.0.0.1', '::1'].includes(u.hostname)); } catch { return false; } }
function toml(value) { return JSON.stringify(String(value)); }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function normalizeModelMappings(value, defaultModel) {
  const seen = new Set();
  const mappings = (Array.isArray(value) ? value : []).map(item => ({
    alias: String(item?.alias || '').trim(), upstream: String(item?.upstream || '').trim().slice(0, 180)
  })).filter(item => item.alias || item.upstream);
  if (!mappings.length) return [{ alias: CODEX_COMPATIBLE_ALIASES[0], upstream: defaultModel }];
  return mappings.map(item => {
    if (!CODEX_COMPATIBLE_ALIASES.includes(item.alias) || seen.has(item.alias)) throw new Error('Codex 模型别名无效或重复');
    if (!item.upstream || /[\r\n\0]/.test(item.upstream)) throw new Error('映射模型名称无效');
    seen.add(item.alias); return item;
  }).slice(0, CODEX_COMPATIBLE_ALIASES.length);
}

function rootConfigLines(text) {
  const lines = String(text || '').split(/\r?\n/);
  const firstTable = lines.findIndex(line => /^\s*\[/.test(line));
  return { lines, firstTable: firstTable < 0 ? lines.length : firstTable };
}

function setRootKey(text, key, value) {
  const { lines, firstTable } = rootConfigLines(text);
  const re = new RegExp(`^\\s*${escapeRegExp(key)}\\s*=`);
  let found = false;
  for (let i = 0; i < firstTable; i++) if (re.test(lines[i])) { lines[i] = `${key} = ${value}`; found = true; break; }
  if (!found) lines.splice(firstTable, 0, `${key} = ${value}`);
  return lines.join('\n');
}

function removeProviderBlock(text, id) {
  const re = new RegExp(`(?:^|\\n)\\[model_providers\\.${escapeRegExp(id)}\\][\\s\\S]*?(?=\\n\\[|$)`, 'g');
  return String(text || '').replace(re, '');
}

function removeOwnedModelCatalog(text) {
  const { lines, firstTable } = rootConfigLines(text);
  const owned = /^\s*model_catalog_json\s*=\s*["'](?:[^"']*\/)?cc-switch-model-catalog\.json["']\s*$/i;
  return lines.filter((line, index) => index >= firstTable || !owned.test(line)).join('\n');
}
function removeOwnedRouteConfig(text) {
  let result = removeOwnedModelCatalog(text);
  const ownedProvider = /^\s*model_provider\s*=\s*["'](?:subscription-lens-[^"']+|subscription_lens)["']\s*$/i;
  const { lines, firstTable } = rootConfigLines(result);
  result = lines.filter((line, index) => index >= firstTable || !ownedProvider.test(line)).join('\n');
  result = result.replace(/(?:^|\n)\[model_providers\.(?:subscription-lens-[^\]\r\n]+|subscription_lens)\][\s\S]*?(?=\n\[|$)/gi, '');
  return result.replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function writeProviderConfig(text, provider) {
  const configId = provider.builtIn ? 'openai' : provider.id;
  let result = String(text || '').replace(/^\uFEFF/, '').trimEnd();
  result = setRootKey(result, 'model_provider', toml(configId));
  result = setRootKey(result, 'model', toml(provider.model));
  result = removeProviderBlock(result, configId).trimEnd();
  if (provider.builtIn) {
    // Codex rejects reserved built-in provider IDs in config.toml and fails
    // the whole config load ("model_providers contains reserved built-in
    // provider IDs"). For built-ins, reference the ID only and drop any
    // stale override block instead of writing one. Clear only the provider
    // and catalog owned by Subscription Lens; user-managed catalogs stay.
    result = removeProviderBlock(result, 'subscription_lens').trimEnd();
    result = removeOwnedModelCatalog(result).trimEnd();
    return `${result}\n`;
  }
  const block = [
    `[model_providers.${configId}]`,
    `name = ${toml(provider.name)}`,
    `base_url = ${toml(provider.baseUrl.replace(/\/$/, ''))}`,
    `wire_api = ${toml(provider.protocol === 'chat' ? 'chat' : 'responses')}`,
    ...(provider.builtIn ? [] : provider.envKey ? [`env_key = ${toml(provider.envKey)}`] : []),
    `requires_openai_auth = ${provider.kind === 'official' ? 'true' : 'false'}`
  ].join('\n');
  return `${result}\n\n${block}\n`;
}

class ProviderManager {
  constructor({ store, getCodexHome, dataDir, credentialVault = null }) {
    this.store = store; this.getCodexHome = getCodexHome; this.dataDir = dataDir; this.credentialVault = credentialVault;
    this.backupDir = path.join(dataDir, 'codex-config-backups');
    const saved = store.get('providers', []);
    this.providers = Array.isArray(saved) && saved.length ? saved : [clone(builtin)];
    if (!this.providers.some(p => p.id === builtin.id)) this.providers.unshift(clone(builtin));
    this.activeId = store.get('activeProviderId', null);
    this.store.set('providers', this.providers);
  }
  list() {
    return this.providers.map(p => {
      const officialBase = /^https:\/\/api\.openai\.com(?:\/v1)?$/i.test(String(p.baseUrl || '').replace(/\/$/, ''));
      const codexAuth = Boolean(p.builtIn || officialBase);
      const appCredential = this.hasStoredCredential(p.id);
      const envCredential = Boolean(p.envKey && process.env[p.envKey]);
      return {
        ...p,
        active: p.id === this.activeId,
        authMode: codexAuth ? 'codex' : appCredential ? 'app' : 'api-key',
        credentialSource: codexAuth ? 'codex' : appCredential ? 'app' : envCredential ? 'env' : null,
        storedCredential: appCredential,
        secretConfigured: codexAuth || appCredential || envCredential
      };
    });
  }
  readSecrets() { return this.store.get('providerSecrets', {}); }
  hasStoredCredential(id) { const value = this.readSecrets()[id]; return Boolean(value && this.credentialVault?.isAvailable?.()); }
  setStoredCredential(id, apiKey) {
    const secrets = this.readSecrets();
    if (!apiKey) { delete secrets[id]; this.store.set('providerSecrets', secrets); return; }
    if (!this.credentialVault?.isAvailable?.()) throw new Error('系统加密存储不可用');
    secrets[id] = this.credentialVault.encrypt(String(apiKey)); this.store.set('providerSecrets', secrets);
  }
  resolveCredential(provider) {
    const encrypted = this.readSecrets()[provider.id];
    if (encrypted && this.credentialVault?.isAvailable?.()) {
      try { return this.credentialVault.decrypt(encrypted); } catch { /* Fall back to the environment variable. */ }
    }
    return provider.envKey ? process.env[provider.envKey] || null : null;
  }
  get(id) { const provider = this.providers.find(p => p.id === id); if (!provider) throw new Error('供应商不存在'); return provider; }
  save(input = {}) {
    const name = String(input.name || '').trim().slice(0, 100); if (!name) throw new Error('供应商名称无效');
    const id = safeId(input.id || name); if (!ID_RE.test(id)) throw new Error('供应商标识无效');
    // CC Switch uses this exact display name as the opt-in switch for Codex
    // remote compaction. Third-party routes must retain their real identity.
    if (id !== builtin.id && name === 'OpenAI') throw new Error('第三方供应商名称不能为 OpenAI');
    const baseUrl = String(input.baseUrl || '').trim().replace(/\/$/, ''); if (!validUrl(baseUrl)) throw new Error('供应商地址无效');
    const model = String(input.model || '').trim().slice(0, 180); if (!model) throw new Error('模型名称无效');
    const modelCatalog = [...new Set([model, ...(Array.isArray(input.modelCatalog) ? input.modelCatalog : [])].map(value => String(value || '').trim().slice(0, 180)).filter(value => value && !/[\r\n\0]/.test(value)))].slice(0, 100);
    const modelMappings = normalizeModelMappings(input.modelMappings, model);
    const envKey = String(input.envKey || 'OPENAI_API_KEY').trim().toUpperCase(); if (!ENV_RE.test(envKey)) throw new Error('环境变量名称无效');
    const protocol = input.protocol === 'chat' ? 'chat' : 'responses';
    const existing = this.providers.find(p => p.id === id);
    const provider = { ...(existing || {}), id, name, kind: id === builtin.id ? 'official' : 'custom', baseUrl, model, modelCatalog, modelMappings, protocol, envKey, enabled: input.enabled !== false, builtIn: id === builtin.id, pricing: input.pricing === 'custom' ? 'custom' : 'catalog', capabilities: { responses: protocol === 'responses', streaming: true, tools: true, reasoning: protocol === 'responses' } };
    if (existing && existing.builtIn && id === builtin.id) Object.assign(provider, { ...clone(builtin), ...provider });
    this.providers = [...this.providers.filter(p => p.id !== id), provider]; this.store.set('providers', this.providers);
    if (Object.hasOwn(input, 'apiKey')) this.setStoredCredential(id, String(input.apiKey || '').trim());
    const listed = this.list().find(item => item.id === id);
    return {
      ...provider,
      active: provider.id === this.activeId,
      storedCredential: listed?.storedCredential || false,
      credentialSource: listed?.credentialSource || null,
      secretConfigured: listed?.secretConfigured || false
    };
  }
  remove(id) { const provider = this.get(id); if (provider.builtIn) throw new Error('不能删除内置供应商'); if (id === this.activeId) throw new Error('不能删除当前供应商'); this.providers = this.providers.filter(p => p.id !== id); this.store.set('providers', this.providers); return true; }
  async importCurrent() {
    const configPath = path.join(this.getCodexHome(), 'config.toml'); let text = ''; try { text = await fsp.readFile(configPath, 'utf8'); } catch { /* Use the official profile when Codex has no config yet. */ }
    const model = (text.match(/^\s*model\s*=\s*["']([^"']+)/m) || [])[1] || builtin.model;
    const providerId = (text.match(/^\s*model_provider\s*=\s*["']([^"']+)/m) || [])[1];
    const baseUrl = providerId && (text.match(new RegExp(`\\[model_providers\\.${escapeRegExp(providerId)}\\][\\s\\S]*?base_url\\s*=\\s*["']([^"']+)`, 'm')) || [])[1];
    const isOfficial = providerId === 'openai' || !baseUrl || /^https:\/\/api\.openai\.com(?:\/v1)?$/i.test(baseUrl.replace(/\/$/, ''));
    const imported = this.save({ id: isOfficial ? 'openai-official' : providerId || 'openai-official', name: isOfficial ? 'OpenAI Official' : providerId || 'Imported Codex', baseUrl: baseUrl || builtin.baseUrl, model, envKey: 'OPENAI_API_KEY', protocol: 'responses' });
    this.activeId = imported.id; this.store.set('activeProviderId', this.activeId);
    return imported;
  }
  async cleanupOfficialRoute() {
    const home = this.getCodexHome(); await fsp.mkdir(home, { recursive: true });
    const configPath = path.join(home, 'config.toml'); let current = '';
    try { current = await fsp.readFile(configPath, 'utf8'); } catch { return { configPath, changed: false, backup: null }; }
    const next = removeOwnedRouteConfig(current);
    if (next === current) return { configPath, changed: false, backup: null };
    await fsp.mkdir(this.backupDir, { recursive: true });
    const backup = path.join(this.backupDir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(3).toString('hex')}.toml`);
    await fsp.writeFile(backup, current, 'utf8');
    const tmp = `${configPath}.${process.pid}.tmp`;
    await fsp.writeFile(tmp, next, 'utf8'); await fsp.rename(tmp, configPath);
    this.activeId = 'openai-official'; this.store.set('activeProviderId', this.activeId); await this.rotateBackups();
    return { configPath, changed: true, backup };
  }
  async activate(id) {
    const provider = this.get(id); if (provider.protocol === 'chat') throw new Error('Chat Completions 供应商需要兼容适配，当前版本不能直接启用'); const home = this.getCodexHome(); await fsp.mkdir(home, { recursive: true });
    const configPath = path.join(home, 'config.toml'); let current = ''; try { current = await fsp.readFile(configPath, 'utf8'); } catch { /* Create a new config when Codex has not been configured. */ }
    await fsp.mkdir(this.backupDir, { recursive: true });
    const backup = path.join(this.backupDir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(3).toString('hex')}.toml`);
    if (current) await fsp.writeFile(backup, current, 'utf8');
    const next = writeProviderConfig(current, provider); const tmp = `${configPath}.${process.pid}.tmp`;
    await fsp.writeFile(tmp, next, 'utf8'); await fsp.rename(tmp, configPath);
    this.activeId = id; this.store.set('activeProviderId', id); await this.rotateBackups();
    return { provider: { ...provider, active: true, secretConfigured: Boolean(this.resolveCredential(provider)) }, configPath, backup: current ? backup : null, needsRestart: true, mode: 'direct' };
  }
  async backupCurrentConfig() {
    const home = this.getCodexHome(); await fsp.mkdir(home, { recursive: true });
    const configPath = path.join(home, 'config.toml'); let current = ''; try { current = await fsp.readFile(configPath, 'utf8'); } catch { /* A first-time Codex configuration has no backup yet. */ }
    if (!current) return { configPath, backup: null };
    await fsp.mkdir(this.backupDir, { recursive: true });
    const backup = path.join(this.backupDir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(3).toString('hex')}.toml`);
    await fsp.writeFile(backup, current, 'utf8'); await this.rotateBackups();
    return { configPath, backup };
  }
  async restoreConfigBackup(backup) {
    if (!backup) return false;
    const root = path.resolve(this.backupDir) + path.sep;
    const candidate = path.resolve(String(backup));
    if (!candidate.startsWith(root)) throw new Error('配置备份路径无效');
    const home = this.getCodexHome(); const configPath = path.join(home, 'config.toml');
    const original = await fsp.readFile(candidate, 'utf8');
    if (!original.trim()) throw new Error('配置备份为空');
    await fsp.mkdir(home, { recursive: true });
    const temporary = `${configPath}.${process.pid}.restore`;
    await fsp.writeFile(temporary, original, 'utf8'); await fsp.rename(temporary, configPath);
    return true;
  }
  async activateViaProxy(id, port) {
    // A GUI-owned Node server disappears when the GUI exits.  It must never be
    // made a Codex startup dependency.  The former implementation rewrote the
    // live config to localhost and left Codex unusable after a restart.
    //
    // The replacement is the CC Switch proxy runtime, whose takeover lifecycle
    // owns a durable backup, restart recovery and the full Codex event bridge.
    // Until that upstream runtime is bundled as a component, fail before any
    // live Codex file or active-provider state is changed.
    void id; void port;
    throw new Error('本地路由正在迁移到 CC Switch 运行时；为保护 Codex 配置，当前版本不会写入本地代理地址。');
  }
  switchActive(id) {
    const provider = this.get(id);
    if (provider.protocol === 'chat') throw new Error('Chat Completions 供应商需要兼容适配，当前版本不能直接启用');
    this.activeId = provider.id; this.store.set('activeProviderId', this.activeId);
    return { provider: { ...provider, active: true, secretConfigured: Boolean(this.resolveCredential(provider)) }, needsRestart: false, mode: 'hot' };
  }
  async isRouterConfigured(port) {
    // Subscription Lens no longer claims ownership of a live local-router
    // configuration.  This also keeps a stale beta configuration from being
    // treated as a safe hot-switch route.
    void port;
    return false;
  }
  async rotateBackups() { let files = []; try { files = (await fsp.readdir(this.backupDir)).filter(f => f.endsWith('.toml')).sort().reverse(); } catch { return; } for (const file of files.slice(10)) await fsp.rm(path.join(this.backupDir, file), { force: true }); }
  async test(id) {
    const provider = this.get(id); const key = this.resolveCredential(provider); const url = `${provider.baseUrl.replace(/\/$/, '')}/models`;
    if (provider.builtIn || /^https:\/\/api\.openai\.com(?:\/v1)?$/i.test(provider.baseUrl.replace(/\/$/, ''))) return { ok: true, skipped: true, provider: id, latencyMs: 0, models: [], protocol: provider.protocol, secretConfigured: Boolean(key), message: '使用 Codex 登录态，无需 OPENAI_API_KEY' };
    const headers = { accept: 'application/json' }; if (key) headers.authorization = `Bearer ${key}`;
    const started = Date.now(); let response;
    try { response = await fetch(url, { headers, signal: AbortSignal.timeout(12000) }); } catch (error) { return { ok: false, provider: id, latencyMs: Date.now() - started, error: error.message, secretConfigured: Boolean(key) }; }
    let models = []; try { const body = await response.json(); models = Array.isArray(body.data) ? body.data.map(m => m.id).filter(Boolean).slice(0, 100) : []; } catch { /* Some endpoints do not expose a JSON model list. */ }
    return { ok: response.ok, status: response.status, provider: id, latencyMs: Date.now() - started, models, protocol: provider.protocol, secretConfigured: Boolean(key), error: response.ok ? null : `HTTP ${response.status}` };
  }
  async discover(input = {}) {
    const baseUrl = String(input.baseUrl || '').trim().replace(/\/$/, '');
    if (!validUrl(baseUrl)) throw new Error('供应商地址无效');
    const explicitKey = String(input.apiKey || '').trim();
    // Editing a provider must not require exposing its encrypted key again.
    // A caller can still use a one-off typed key before the provider is saved.
    const existing = String(input.id || '').trim() ? this.providers.find(item => item.id === String(input.id).trim()) : null;
    const apiKey = explicitKey || (existing && existing.baseUrl === baseUrl ? this.resolveCredential(existing) : null);
    const headers = { accept: 'application/json' };
    if (apiKey) headers.authorization = `Bearer ${apiKey}`;
    const started = Date.now(); let response;
    try { response = await fetch(`${baseUrl}/models`, { headers, signal: AbortSignal.timeout(12000) }); }
    catch (error) { return { ok: false, latencyMs: Date.now() - started, models: [], error: error.message }; }
    let models = [];
    try { const body = await response.json(); models = Array.isArray(body.data) ? body.data.map(item => item.id).filter(Boolean).slice(0, 100) : []; } catch { /* Some compatible endpoints do not expose models. */ }
    return { ok: response.ok, status: response.status, latencyMs: Date.now() - started, models, error: response.ok ? null : `HTTP ${response.status}` };
  }
  status() { return { activeId: this.activeId, providers: this.list(), configPath: path.join(this.getCodexHome(), 'config.toml'), backupDir: this.backupDir }; }
}

module.exports = { ProviderManager, builtin, writeProviderConfig, CODEX_COMPATIBLE_ALIASES };
