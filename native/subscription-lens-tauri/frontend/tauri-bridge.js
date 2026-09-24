/*
 * Electron-compatible renderer bridge.
 *
 * The original Sublens pages intentionally remain unchanged.  This adapter
 * translates their `window.lens` calls to the CCS Tauri commands, so the
 * renderer keeps the same visual and interaction surface while the native
 * runtime owns storage, OAuth and provider switching.
 */
(function () {
  'use strict';

  const internals = window.__TAURI_INTERNALS__;
  const frontendLogKey = 'subscription-lens.frontend-log';
  const redactContext = (value) => {
    if (Array.isArray(value)) return value.map(redactContext);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      /(api.?key|access.?token|refresh.?token|password|secret|authorization|bearer|credential)/i.test(key) ? '[redacted]' : redactContext(item),
    ]));
  };
  const recordFrontendLog = (level, message, context) => {
    const entry = { at: new Date().toISOString(), level, message: String(message || ''), context: redactContext(context) || null };
    try {
      const previous = JSON.parse(localStorage.getItem(frontendLogKey) || '[]');
      localStorage.setItem(frontendLogKey, JSON.stringify([...previous.slice(-99), entry]));
    } catch { /* logging must never break the page */ }
    if (internals && typeof internals.invoke === 'function') {
      Promise.resolve(internals.invoke('write_sublens_frontend_log', {
        level: String(level),
        message: entry.message,
        context: entry.context ? JSON.stringify(entry.context) : null,
      })).catch(() => {});
    }
  };
  const invoke = (command, args = {}) => {
    if (!internals || typeof internals.invoke !== 'function') {
      throw new Error('Tauri 原生桥不可用');
    }
    return internals.invoke(command, args).catch((error) => {
      recordFrontendLog('error', `invoke ${command} failed: ${error?.message || error}`, args);
      throw error;
    });
  };
  const success = (value) => ({ ok: true, value });
  const failure = (error) => ({ ok: false, error: String(error?.message || error || '操作失败') });
  const safe = (fn) => (...args) => Promise.resolve().then(() => fn(...args)).then(success, failure);
  window.addEventListener('error', (event) => recordFrontendLog('error', event.message || 'renderer error', { source: event.filename, line: event.lineno, column: event.colno }));
  window.addEventListener('unhandledrejection', (event) => recordFrontendLog('error', `unhandled rejection: ${event.reason?.message || event.reason || 'unknown'}`));
  recordFrontendLog('info', 'renderer initialized', { version: '3.0.0-beta.1', host: 'tauri' });

  const codexHome = () => {
    const home = String(navigator.userAgent || '').includes('Windows') ? '%USERPROFILE%' : '~';
    return `${home}\\.codex`;
  };
  const prefKey = 'subscription-lens.preferences';
  const readPrefs = () => {
    try { return JSON.parse(localStorage.getItem(prefKey) || '{}') || {}; } catch { return {}; }
  };
  const writePrefs = (patch) => {
    const next = { ...readPrefs(), ...(patch || {}) };
    localStorage.setItem(prefKey, JSON.stringify(next));
    return next;
  };
  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const moneyNumber = (value) => number(value, 0);
  const parseToml = (text, key) => {
    const match = String(text || '').match(new RegExp(`^\\s*${key}\\s*=\\s*["']([^"']*)`, 'm'));
    return match?.[1] || '';
  };
  const settingsConfigOf = (provider) => provider?.settingsConfig && typeof provider.settingsConfig === 'object'
    ? provider.settingsConfig : {};
  const configTextOf = (provider) => {
    const config = settingsConfigOf(provider).config;
    return typeof config === 'string' ? config : '';
  };
  const isBuiltin = (provider) => {
    const id = String(provider?.id || '').toLowerCase();
    return id === 'openai' || id === 'openai-official' || id.includes('official');
  };

  function normalizeProvider(provider) {
    const settings = settingsConfigOf(provider);
    const config = configTextOf(provider);
    const modelCatalog = Array.isArray(settings.modelCatalog?.models)
      ? settings.modelCatalog.models.map((item) => typeof item === 'string' ? item : item.model).filter(Boolean)
      : [];
    const builtIn = isBuiltin(provider);
    const baseUrl = parseToml(config, 'base_url') || settings.base_url || settings.baseUrl || (builtIn ? 'https://api.openai.com/v1' : '');
    const model = parseToml(config, 'model') || settings.model || modelCatalog[0] || '';
    const protocol = parseToml(config, 'wire_api') || parseToml(config, 'api_format') || 'responses';
    const auth = settings.auth && typeof settings.auth === 'object' ? settings.auth : {};
    const envKey = Object.keys(auth)[0] || settings.envKey || 'OPENAI_API_KEY';
    const providerType = String(provider?.meta?.providerType || '');
    return {
      ...provider,
      builtIn,
      active: false,
      baseUrl,
      model,
      protocol,
      envKey,
      authMode: providerType === 'codex_oauth' ? 'codex_oauth' : null,
      storedCredential: Object.values(auth).some((value) => String(value || '').trim().length > 0),
      credentialSource: Object.keys(auth)[0] || null,
      modelCatalog,
      modelMappings: Array.isArray(settings.modelMappings) ? settings.modelMappings : [],
      settingsConfig: settings,
    };
  }

  async function providerStatus() {
    const raw = await invoke('get_providers', { app: 'codex' });
    const current = await invoke('get_current_provider', { app: 'codex' });
    const providers = Object.values(raw || {}).map(normalizeProvider).map((item) => ({ ...item, active: item.id === current }));
    return { activeId: current, providers, configPath: `${codexHome()}\\config.toml`, backupDir: null };
  }

  function rangeFor(period) {
    const now = Math.floor(Date.now() / 1000);
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    const today = Math.floor(date.getTime() / 1000);
    if (period === 'today') return { startDate: today, endDate: now };
    if (period === 'week') return { startDate: now - 7 * 86400, endDate: now };
    if (period === 'month') return { startDate: now - 30 * 86400, endDate: now };
    if (period === 'cycle') return { startDate: now - 30 * 86400, endDate: now };
    if (period === 'all') return { startDate: null, endDate: now };
    return { startDate: now - 30 * 86400, endDate: now };
  }

  function mapModel(item) {
    return {
      model: item.model,
      // CCS keeps `totalTokens` cache-normalized for its own analytics. The
      // original Sublens overview counts the actual processed tokens, which
      // includes cache reads/writes. The runtime now exposes both values so
      // the distribution matches the overview headline and the Electron UI.
      tokens: number(item.realTotalTokens, number(item.totalTokens)),
      input: number(item.totalInputTokens),
      output: number(item.totalOutputTokens),
      cached: number(item.totalCacheReadTokens),
      write: number(item.totalCacheCreationTokens),
      reasoning: 0,
      events: number(item.requestCount),
      usd: moneyNumber(item.totalCost),
      amount: moneyNumber(item.totalCost),
    };
  }

  function projectNameFromCwd(cwd) {
    const value = String(cwd || '').replace(/[\\/]+$/, '');
    if (!value) return '';
    const parts = value.split(/[\\/]+/).filter(Boolean);
    return parts.at(-1) || '';
  }

  function mapLog(item, sessionCatalog = new Map()) {
    const at = item.createdAt ? new Date(number(item.createdAt) * 1000).toISOString() : null;
    const input = number(item.inputTokens);
    const cached = number(item.cacheReadTokens);
    const write = number(item.cacheCreationTokens);
    const output = number(item.outputTokens);
    // Codex stores input_tokens as the cache-inclusive input total. Adding
    // cache counters again would double-count the same tokens.
    const total = input + output;
    const usd = moneyNumber(item.totalCostUsd);
    // Session-import rows keep the root Codex thread in their request id.
    // `get_request_logs` does not currently serialize the database session_id,
    // so recover it here instead of treating every token event as a session.
    const sessionMatch = String(item.requestId || '').match(/^codex_session:thread-v1:([^:]+):\d+$/);
    const session = item.sessionId || sessionMatch?.[1] || item.requestId;
    const catalogEntry = sessionCatalog.get(String(session)) || null;
    const isCodexSession = item.dataSource === 'codex_session';
    const project = catalogEntry?.project || (isCodexSession ? '未分类' : item.providerName || item.appType || 'Codex');
    return {
      id: item.requestId,
      at,
      project,
      session,
      title: catalogEntry?.title || null,
      parent: null,
      model: item.model,
      input,
      cached,
      write,
      output,
      reasoning: 0,
      total,
      usd,
      price: { usd, amount: usd, parts: null, reason: null, version: 'CCS', context: 'standard' },
      quality: 'complete',
      status: item.statusCode >= 200 && item.statusCode < 400 ? 'ok' : 'error',
      latencyMs: item.latencyMs,
      ttftMs: item.firstTokenMs,
      provider: item.providerName || item.providerId,
      origin: item.dataSource || 'ccs',
      unpriced: !item.pricingModel && total > 0 && usd === 0,
    };
  }

  function providerForModel(model) {
    const value = String(model || '').trim().toLowerCase();
    const families = [
      [/^codex-auto-review(?:[./:_-]|$)/, 'Codex Auto Review'],
      [/^deepseek(?:[./:_-]|$)/, 'DeepSeek'],
      [/^(?:qwen|qwq)(?:[./:_-]|$)/, 'Alibaba Cloud'],
      [/^(?:kimi|moonshot)(?:[./:_-]|$)/, 'Moonshot AI'],
      [/^(?:glm|zhipu|zai)(?:[./:_-]|$)/, 'Zhipu AI'],
      [/^minimax(?:[./:_-]|$)/, 'MiniMax'],
      [/^claude(?:[./:_-]|$)/, 'Anthropic'],
      [/^gemini(?:[./:_-]|$)/, 'Google'],
      [/^(?:gpt|o[13456])(?:[./:_-]|$)/, 'OpenAI'],
    ];
    return families.find(([pattern]) => pattern.test(value))?.[1] || 'Unknown';
  }

  function mapQuota(raw) {
    if (!raw?.success || !Array.isArray(raw.tiers) || !raw.tiers.length) return null;
    return {
      source: 'account',
      observedAt: raw.queriedAt ? new Date(raw.queriedAt).toISOString() : new Date().toISOString(),
      windows: raw.tiers.map((tier) => ({
        label: tier.name,
        limit: tier.name,
        used: number(tier.utilization),
        resetsAt: tier.resetsAt ? Math.floor(Date.parse(tier.resetsAt) / 1000) : null,
        minutes: tier.name.includes('seven') ? 7 * 1440 : 5 * 60,
      })),
    };
  }

  // Tab navigation reuses the same filter set. Keep the assembled snapshot
  // briefly so switching views does not reread thousands of Codex rows and
  // rerun every CCS aggregation command. Mutations explicitly invalidate it.
  const queryCache = new Map();
  const queryInflight = new Map();
  let queryGeneration = 0;
  const QUERY_CACHE_TTL_MS = 15_000;
  function queryCacheKey(filters) {
    return JSON.stringify({
      period: filters.period || 'month',
      model: filters.model || '',
      query: filters.query || '',
      device: filters.device || '',
      project: filters.project || '',
      session: filters.session || '',
      day: filters.day || '',
      unpriced: Boolean(filters.unpriced),
      sort: filters.sort || 'cost',
      offset: number(filters.offset),
      limit: number(filters.limit, 50),
    });
  }

  function localDay(value) {
    if (!value) return '';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function aggregateHierarchy(rows) {
    const projects = new Map();
    const sessions = new Map();
    const add = (map, key, row) => {
      const normalized = String(key || '未分类');
      let group = map.get(normalized);
      if (!group) {
        group = { key: normalized, tokens: 0, usd: 0, events: 0, unpriced: 0, first: row.at, last: row.at, models: new Set(), sessions: new Set() };
        map.set(normalized, group);
      }
      group.tokens += row.total;
      group.usd += row.usd;
      group.events += 1;
      group.unpriced += row.unpriced ? 1 : 0;
      group.first = !group.first || (row.at && row.at < group.first) ? row.at : group.first;
      group.last = !group.last || (row.at && row.at > group.last) ? row.at : group.last;
      if (row.model) group.models.add(row.model);
      if (row.session) group.sessions.add(row.session);
      return group;
    };
    let tokens = 0;
    let usd = 0;
    let unpriced = 0;
    for (const row of rows) {
      tokens += row.total;
      usd += row.usd;
      unpriced += row.unpriced ? 1 : 0;
      add(projects, row.project, row);
      const session = add(sessions, row.session, row);
      if (!session.project) session.project = row.project;
      if (!session.title && row.title) session.title = row.title;
      if (!session.parent && row.parent) session.parent = row.parent;
    }
    const finish = (map) => [...map.values()].map((group) => ({
      ...group,
      amount: String(group.usd),
      models: [...group.models],
      sessions: group.sessions.size,
    })).sort((a, b) => b.usd - a.usd || b.tokens - a.tokens || a.key.localeCompare(b.key));
    return {
      projects: finish(projects),
      sessions: finish(sessions),
      summary: { tokens, usd, events: rows.length, unpriced },
    };
  }
  function invalidateQueryCache() {
    queryGeneration += 1;
    queryCache.clear();
    queryInflight.clear();
  }

  async function buildQueryFresh(filters = {}) {
    const { startDate, endDate } = rangeFor(filters.period);
    const modelFilter = filters.model || null;
    const providerName = null;
    const common = { startDate, endDate, appType: 'codex', providerName, model: modelFilter };
    const [summary, trends, models, providers, logs, settings, providerInfo, authStatus, scannedSessions] = await Promise.all([
      invoke('get_usage_summary', common),
      invoke('get_usage_trends', common),
      invoke('get_model_stats', common),
      invoke('get_provider_stats', common),
      // Pull the complete selected range once. CCS's model statistics are
      // cache-normalized, while Sublens's historical view is cache-inclusive;
      // the complete rows also retain session counts and provider families.
      invoke('get_request_logs', { filters: { appType: 'codex', model: modelFilter, startDate, endDate }, page: 0, pageSize: 10000 }),
      invoke('get_settings'),
      providerStatus(),
      invoke('auth_get_status', { authProvider: 'codex_oauth' }).catch(() => null),
      // This is CCS's own session scanner. It supplies the authoritative
      // local file and thread count; request logs represent token events,
      // not conversations.
      invoke('list_sessions').catch(() => []),
    ]);
    const codexSessions = (scannedSessions || []).filter((entry) => entry?.providerId === 'codex');
    const sessionCatalog = new Map(codexSessions.map((entry) => [String(entry.sessionId), {
      title: entry.title || null,
      cwd: entry.projectDir || null,
      project: projectNameFromCwd(entry.projectDir) || '未分类',
    }]));
    let quota = null;
    try { quota = mapQuota(await invoke('get_codex_oauth_quota', { accountId: null })); } catch { /* quota is optional */ }
    const totalTokens = number(summary?.realTotalTokens, number(summary?.totalInputTokens) + number(summary?.totalOutputTokens));
    const usd = moneyNumber(summary?.totalCost);
    const events = number(summary?.totalRequests);
    const trendDays = (trends || []).map((item) => ({
      date: item.date,
      tokens: number(item.totalTokens),
      usd: moneyNumber(item.totalCost),
      events: number(item.requestCount),
    }));
    const needle = String(filters.query || '').trim().toLowerCase();
    const allLogRows = (logs?.data || []).map((item) => mapLog(item, sessionCatalog)).filter((row) => {
      const haystack = [row.project, row.title, row.model, row.session, row.provider].map((value) => String(value || '').toLowerCase()).join(' ');
      return (!filters.project || row.project === filters.project)
        && (!filters.session || row.session === filters.session)
        && (!filters.day || localDay(row.at) === filters.day)
        && (!filters.unpriced || row.unpriced)
        && (!needle || haystack.includes(needle));
    });
    const offset = number(filters.offset);
    const limit = number(filters.limit, 50);
    const orderedRows = [...allLogRows].sort((a, b) => filters.sort === 'recent'
      ? String(b.at || '').localeCompare(String(a.at || ''))
      : (b.unpriced ? -1 : b.usd) - (a.unpriced ? -1 : a.usd) || String(b.at || '').localeCompare(String(a.at || '')));
    const logRows = orderedRows.slice(offset, offset + limit);
    // Only session-import records can be associated with a local Codex
    // conversation. Proxy requests without a session id remain in totals,
    // but must not create thousands of fake one-request sessions/projects.
    const sessionRows = allLogRows.filter((row) => row.origin === 'codex_session' && sessionCatalog.has(String(row.session)));
    const hierarchy = aggregateHierarchy(sessionRows);
    const providerRows = (providers || []).map((item) => ({ provider: item.providerName || item.providerId || 'Unknown', model: '', tokens: number(item.realTotalTokens, number(item.totalTokens)), usd: moneyNumber(item.totalCost), events: number(item.requestCount) }));
    const modelsRows = (models || []).map(mapModel);
    // Session logs do not persist the selected upstream provider. Classify
    // model families for the provider drill-down instead of showing one
    // opaque "Codex (Session)" bucket.
    const modelProviders = modelsRows.map((item) => ({
      ...item,
      key: `${providerForModel(item.model)}:${item.model}`,
      provider: providerForModel(item.model),
    }));
    const sourceSessionCount = codexSessions.length;
    const hasHierarchyFilter = Boolean(filters.project || filters.session || filters.day || filters.query || filters.unpriced);
    // The headline remains the CCS usage total. Project/session drill-downs
    // intentionally show only records with an actual local session link.
    const baseSummary = hasHierarchyFilter
      ? hierarchy.summary
      : { tokens: totalTokens, usd, events, unpriced: 0 };
    const outlooks = quota ? quota.windows.map((window) => ({
      ...window,
      remaining: Math.max(0, 100 - number(window.used)),
      state: 'on_track',
      secondsToReset: window.resetsAt ? Math.max(0, window.resetsAt - Math.floor(Date.now() / 1000)) : null,
      forecast: null,
      forecasts: {},
    })) : [];
    const root = settings?.codexConfigDir || settings?.codexPath || codexHome();
    const prefs = readPrefs();
    const appSettings = {
      ...(settings || {}),
      roots: Array.isArray(settings?.roots) ? settings.roots : [root],
      paid: prefs.paid ?? null,
      extra: number(prefs.extra),
      cycleStart: prefs.cycleStart || '',
      cycleEnd: prefs.cycleEnd || '',
      language: prefs.language || settings?.language || 'system',
      theme: prefs.theme || 'system',
      fontScale: prefs.fontScale || 'normal',
      tray: prefs.tray ?? settings?.showInTray ?? true,
      startup: prefs.startup ?? settings?.launchOnStartup ?? false,
      accountEnabled: Boolean(authStatus?.authenticated),
    };
    return {
      monitor: { sources: [], providers: providerRows, models: modelsRows, summary: { requests: events, tokens: totalTokens, estimated: usd, pricedTokens: totalTokens, unpriced: 0 } },
      period: filters.period || 'month',
      range: { from: startDate ? new Date(startDate * 1000).toISOString() : null, to: new Date(endDate * 1000).toISOString() },
      summary: { tokens: baseSummary.tokens, cached: number(summary?.totalCacheReadTokens), output: number(summary?.totalOutputTokens), pricedTokens: baseSummary.tokens, unpriced: baseSummary.unpriced, events: baseSummary.events, sessions: hierarchy.sessions.length, usd: baseSummary.usd, diff: null, ratio: null },
      models: modelsRows,
      modelProviders,
      projects: hierarchy.projects.slice(0, 50),
      sessions: hierarchy.sessions.slice(offset, offset + limit),
      sessionTotal: hierarchy.sessions.length,
      days: trendDays,
      trend: { days: trendDays, models: modelsRows, modelsByDay: [] },
      rows: logRows,
      offset,
      limit,
      quota,
      outlooks,
      comparison: {},
      cycle: { start: '', end: '', paid: appSettings.paid, extra: appSettings.extra },
      account: { state: authStatus?.authenticated ? 'connected' : 'signed_out', plan: null, usage: null, updatedAt: null, lastError: null },
      settings: appSettings,
      scanner: { running: false, processed: 0, files: 0, lastScan: null, errors: 0 },
      stats: { sessions: sourceSessionCount, records: number(logs?.total, allLogRows.length), earliest: startDate ? new Date(startDate * 1000).toISOString() : null, latest: new Date(endDate * 1000).toISOString() },
      fileStats: { files: new Set(codexSessions.map((entry) => entry.sourcePath).filter(Boolean)).size, errors: 0 },
      allModels: modelsRows.map((item) => item.model),
      catalog: await modelCatalog(),
      detectedRoot: root,
      devices: [],
      currentDevice: null,
      desktop: { compact: false, pinned: false, version: '3.0.0-beta.1', detectedMonitors: [] },
      health: { reasons: [], readErrors: 0, parseErrors: 0, partial: 0 },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      providers: providerInfo,
      router: { embedded: true, running: false },
    };
  }

  async function buildQuery(filters = {}) {
    const key = queryCacheKey(filters);
    const cached = queryCache.get(key);
    if (cached && Date.now() - cached.at < QUERY_CACHE_TTL_MS) return cached.value;
    if (queryInflight.has(key)) return queryInflight.get(key);
    const generation = queryGeneration;
    const pending = buildQueryFresh(filters).then((value) => {
      if (generation === queryGeneration) {
        queryCache.set(key, { at: Date.now(), value });
        while (queryCache.size > 12) queryCache.delete(queryCache.keys().next().value);
      }
      if (queryInflight.get(key) === pending) queryInflight.delete(key);
      return value;
    }, (error) => {
      if (queryInflight.get(key) === pending) queryInflight.delete(key);
      throw error;
    });
    queryInflight.set(key, pending);
    return pending;
  }

  async function modelCatalog() {
    try {
      const rows = await invoke('get_model_pricing');
      const models = {};
      for (const item of rows || []) {
        models[item.modelId] = {
          standard: {
            input: item.inputCostPerMillion,
            cached: item.cacheReadCostPerMillion,
            write: item.cacheCreationCostPerMillion,
            output: item.outputCostPerMillion,
          },
          threshold: null,
        };
      }
      return { version: 'CCS', asOf: new Date().toISOString().slice(0, 10), models };
    } catch {
      return { version: 'CCS', asOf: new Date().toISOString().slice(0, 10), models: {} };
    }
  }

  let loginDeviceCode = null;

  const api = {
    query: safe(buildQuery),
    providerList: safe(providerStatus),
    providerManager: safe(() => {
      localStorage.setItem('cc-switch-last-app', 'codex');
      localStorage.setItem('cc-switch-last-view', 'providers');
      window.location.assign(new URL('ccswitch/index.html', window.location.href).href);
    }),
    providerDelete: safe(async (id) => { const result = await invoke('delete_provider', { app: 'codex', id }); invalidateQueryCache(); return result; }),
    providerImportCurrent: safe(async () => { const result = await invoke('import_default_config', { app: 'codex' }); invalidateQueryCache(); return result; }),
    providerActivate: safe(async (id) => { const result = await invoke('switch_provider', { app: 'codex', id }); invalidateQueryCache(); return result; }),
    providerActivateProxy: safe(async (id) => { const result = await invoke('switch_provider', { app: 'codex', id }); invalidateQueryCache(); return result; }),
    providerSwitch: safe(async (id) => { const result = await invoke('switch_provider', { app: 'codex', id }); invalidateQueryCache(); return result; }),
    providerTest: safe(async (id) => {
      const status = await providerStatus();
      const provider = status.providers.find((item) => item.id === id);
      if (!provider) throw new Error('供应商不存在');
      if (provider.builtIn) return { ok: true, skipped: true, models: [] };
      const key = provider.settingsConfig?.auth ? Object.values(provider.settingsConfig.auth)[0] || '' : '';
      const started = Date.now();
      try {
        const models = await invoke('fetch_models_for_config', { baseUrl: provider.baseUrl, apiKey: key, isFullUrl: false, modelsUrl: null, customUserAgent: null, apiFormat: provider.protocol, requestHeaders: null });
        return { ok: true, latencyMs: Date.now() - started, models: (models || []).map((item) => item.id || item.model || item) };
      } catch (error) {
        return { ok: false, latencyMs: Date.now() - started, models: [], error: String(error) };
      }
    }),
    providerDiscover: safe(async (input) => {
      const models = await invoke('fetch_models_for_config', { baseUrl: input.baseUrl, apiKey: input.apiKey || '', isFullUrl: false, modelsUrl: null, customUserAgent: null, apiFormat: input.protocol || 'responses', requestHeaders: null });
      return { ok: true, models: (models || []).map((item) => item.id || item.model || item).filter(Boolean) };
    }),
    routerStart: safe(() => true),
    routerStop: safe(() => true),
    saveSettings: safe(async (patch) => {
      const current = await invoke('get_settings');
      const nextPrefs = writePrefs(patch);
      const merged = {
        ...(current || {}),
        language: patch?.language === 'system' ? null : (patch?.language ?? current?.language ?? null),
        showInTray: patch?.tray ?? current?.showInTray ?? true,
        launchOnStartup: patch?.startup ?? current?.launchOnStartup ?? false,
      };
      await invoke('save_settings', { settings: merged });
      invalidateQueryCache();
      return { ...merged, ...nextPrefs, tray: nextPrefs.tray, startup: nextPrefs.startup };
    }),
    refresh: safe(async () => { const result = await invoke('sync_session_usage'); invalidateQueryCache(); return result; }),
    rescan: safe(async () => { const result = await invoke('sync_session_usage'); invalidateQueryCache(); return result; }),
    useDetectedRoot: safe(async () => {
      const path = await invoke('get_config_dir', { app: 'codex' });
      await invoke('save_settings', { settings: { ...(await invoke('get_settings')), codexConfigDir: path } });
      return path;
    }),
    chooseRoot: safe(async () => {
      const current = await invoke('get_config_dir', { app: 'codex' });
      const path = await invoke('pick_directory', { defaultPath: current });
      if (!path) return null;
      await invoke('save_settings', { settings: { ...(await invoke('get_settings')), codexConfigDir: path } });
      return path;
    }),
    chooseCodex: safe(() => invoke('open_config_folder', { app: 'codex' })),
    connect: safe(() => invoke('auth_get_status', { authProvider: 'codex_oauth' })),
    login: safe(async () => {
      const device = await invoke('auth_start_login', { authProvider: 'codex_oauth', githubDomain: null, targetAccountId: null });
      loginDeviceCode = device.deviceCode;
      await invoke('open_external', { url: device.verificationUri });
      const interval = Math.max(Number(device.interval || 5), 2) * 1000;
      const deadline = Date.now() + Number(device.expiresIn || 600) * 1000;
      const poll = async () => {
        if (!loginDeviceCode || Date.now() >= deadline) return;
        try {
          const account = await invoke('auth_poll_for_account', { authProvider: 'codex_oauth', deviceCode: loginDeviceCode, githubDomain: null });
          if (account) { loginDeviceCode = null; invalidateQueryCache(); window.dispatchEvent(new Event('lens-auth-changed')); return; }
        } catch { /* authorization remains pending */ }
        window.setTimeout(poll, interval);
      };
      window.setTimeout(poll, interval);
      return { ...device, opened: true };
    }),
    cancelLogin: safe(async () => {
      if (!loginDeviceCode) return false;
      const code = loginDeviceCode;
      loginDeviceCode = null;
      return invoke('auth_cancel_login', { authProvider: 'codex_oauth', deviceCode: code });
    }),
    disconnect: safe(async () => { const result = await invoke('auth_logout', { authProvider: 'codex_oauth' }); invalidateQueryCache(); return result; }),
    exportCsv: safe(async (filters) => {
      const data = await buildQuery(filters || {});
      const header = ['时间','项目','模型','Tokens','缓存读取','缓存写入','输出','API等价成本','状态'];
      const lines = [header, ...(data.rows || []).map((row) => [row.at, row.project, row.model, row.total, row.cached, row.write, row.output, row.usd, row.status])];
      const csv = lines.map((line) => line.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob(['\\ufeff', csv], { type: 'text/csv;charset=utf-8' })); anchor.download = `subscription-lens-${new Date().toISOString().slice(0,10)}.csv`; anchor.click(); URL.revokeObjectURL(anchor.href);
      return data.rows?.length || 0;
    }),
    exportPrices: safe(async () => {
      const catalog = await modelCatalog();
      const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([JSON.stringify(catalog, null, 2)], { type: 'application/json' })); anchor.download = 'subscription-lens-model-prices.json'; anchor.click(); URL.revokeObjectURL(anchor.href); return Object.keys(catalog.models || {}).length;
    }),
    importPrices: safe(() => 0),
    resetPrices: safe(() => true),
    openPricing: safe(() => invoke('open_external', { url: 'https://models.dev' })),
    diagnostics: safe(async () => {
      const snapshot = await buildQuery({ period: 'month', offset: 0, limit: 50 });
      const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([JSON.stringify({ generatedAt: new Date().toISOString(), snapshot }, null, 2)], { type: 'application/json' })); anchor.download = 'subscription-lens-diagnostics.json'; anchor.click(); URL.revokeObjectURL(anchor.href); return true;
    }),
    exportDeviceLedger: safe(() => 0),
    importDeviceLedger: safe(() => ({ added: 0 })),
    renameDevice: safe(() => true),
    previewReport: safe(async (filters) => {
      const data = await buildQuery(filters || {});
      return { from: data.range.from, to: data.range.to, tokens: data.summary.tokens, usd: data.summary.usd, coverage: data.summary.tokens ? data.summary.pricedTokens / data.summary.tokens : null, priceDate: data.catalog.asOf };
    }),
    exportReport: safe(async (filters) => {
      const data = await buildQuery(filters || {});
      const report = { from: data.range.from, to: data.range.to, tokens: data.summary.tokens, usd: data.summary.usd, coverage: data.summary.tokens ? data.summary.pricedTokens / data.summary.tokens : null, priceDate: data.catalog.asOf };
      const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })); anchor.download = 'subscription-lens-summary.json'; anchor.click(); URL.revokeObjectURL(anchor.href); return true;
    }),
    setCompact: safe((compact) => { writePrefs({ compact: Boolean(compact) }); return Boolean(compact); }),
    setPinned: safe((pinned) => { writePrefs({ pinned: Boolean(pinned) }); return Boolean(pinned); }),
    changed: (callback) => {
      const timer = window.setInterval(() => { invalidateQueryCache(); callback(); }, 30_000);
      return () => window.clearInterval(timer);
    },
  };

  window.lens = api;
})();
