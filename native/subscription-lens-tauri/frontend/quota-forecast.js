/* Local-only quota history and remaining-time forecasts for the Tauri host. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SubscriptionLensQuotaForecast = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const RETENTION_MS = 2 * 86400000;
  const MAX_SAMPLES = 25000;
  const SAMPLE_INTERVAL_MS = 60000;

  function mapCodexQuotaResponse(raw) {
    if (!raw?.success || !Array.isArray(raw.tiers) || !raw.tiers.length) return null;
    const observedDate = raw.queriedAt === null || raw.queriedAt === undefined
      ? new Date() : new Date(Number(raw.queriedAt));
    const observedAt = Number.isFinite(observedDate.getTime()) ? observedDate.toISOString() : new Date().toISOString();
    return {
      source: 'account',
      observedAt,
      windows: raw.tiers.map((tier) => ({
        label: tier.name,
        limit: tier.name,
        window: tier.name,
        used: Number.isFinite(Number(tier.utilization)) ? Number(tier.utilization) : 0,
        resetsAt: tier.resetsAt ? Math.floor(Date.parse(tier.resetsAt) / 1000) : null,
        minutes: tier.name.includes('seven') ? 7 * 1440 : 5 * 60,
        // quotaOutlook validates freshness per window, so carry the response
        // timestamp down from the snapshot before calculating remaining quota.
        observedAt,
      })),
    };
  }

  function recordObservation(history, quota, identity, now = Date.now()) {
    const rows = Array.isArray(history) ? history.filter(validSample) : [];
    if (!quota || !Array.isArray(quota.windows)) return rows;
    for (const window of quota.windows) {
      const at = Date.parse(window.observedAt || quota.observedAt || '');
      const reset = Number(window.resetsAt);
      const used = Number(window.used);
      if (!Number.isFinite(at) || !Number.isFinite(reset) || !Number.isFinite(used)) continue;
      const sample = {
        identity: String(identity || 'default'),
        limit: String(window.limit || window.label || 'codex'),
        window: String(window.window || window.limit || window.label || 'primary'),
        reset,
        at,
        used,
      };
      const bucket = Math.floor(at / SAMPLE_INTERVAL_MS);
      const existing = rows.findIndex((item) => item.identity === sample.identity
        && item.limit === sample.limit && item.window === sample.window
        && item.reset === sample.reset && Math.floor(item.at / SAMPLE_INTERVAL_MS) === bucket);
      if (existing < 0) rows.push(sample);
      else if (rows[existing].at <= at) rows[existing] = sample;
    }
    return rows.filter((sample) => sample.reset * 1000 >= now - RETENTION_MS)
      .sort((a, b) => a.at - b.at).slice(-MAX_SAMPLES);
  }

  function validSample(sample) {
    return sample && typeof sample.identity === 'string' && typeof sample.limit === 'string'
      && typeof sample.window === 'string' && Number.isFinite(Number(sample.reset))
      && Number.isFinite(Number(sample.at)) && Number.isFinite(Number(sample.used));
  }

  function stablePoints(points) {
    for (let i = points.length - 1; i > 0; i--) {
      if (points[i].used < points[i - 1].used) return points.slice(i);
    }
    return points;
  }

  function fromPoints(points, remaining, reset, now, scope) {
    if (points.length < 3) return null;
    const first = points[0];
    const last = points[points.length - 1];
    const minutes = (last.at - first.at) / 60000;
    const delta = last.used - first.used;
    if (minutes < 15 || delta < 0) return null;
    const untilReset = Math.max(0, (reset * 1000 - now) / 1000);
    if (delta === 0) return {
      minutes, samples: points.length, percentPerHour: 0, seconds: untilReset,
      fastSeconds: untilReset, slowSeconds: untilReset, scope,
    };
    const rate = delta / minutes;
    return {
      minutes,
      samples: points.length,
      percentPerHour: rate * 60,
      seconds: remaining / rate * 60,
      fastSeconds: Math.max(0, remaining - 1) / ((delta + 1) / minutes) * 60,
      slowSeconds: delta > 1 ? (remaining + 1) / ((delta - 1) / minutes) * 60 : null,
      scope,
    };
  }

  function quotaOutlook(window, history, { now = Date.now(), identity = 'default', live = false } = {}) {
    const observedAt = Date.parse(window?.observedAt || '');
    const reset = Number(window?.resetsAt);
    const remaining = Math.max(0, 100 - Number(window?.used || 0));
    const empty = { quota_window: null, recent_24h: null, recent_2h: null };
    const base = {
      ...window,
      remaining,
      secondsToReset: Number.isFinite(reset) ? Math.max(0, reset * 1000 - now) / 1000 : null,
      forecast: null,
      forecasts: empty,
      observation: { samples: 0, minutes: 0, requiredMinutes: 15 },
    };
    if (!Number.isFinite(observedAt) || now - observedAt > 180000 || observedAt > now + 30000 || !live) return { ...base, state: 'stale' };
    if (!Number.isFinite(reset) || reset * 1000 <= now) return { ...base, state: 'expired' };
    if (remaining <= 0) return { ...base, state: 'exhausted' };
    const minutesInWindow = Number(window.minutes);
    const windowStart = Number.isFinite(minutesInWindow) && minutesInWindow > 0
      ? reset * 1000 - minutesInWindow * 60000 : null;
    const points = stablePoints((Array.isArray(history) ? history : [])
      .filter((sample) => validSample(sample)
        && sample.identity === String(identity || 'default')
        && sample.limit === String(window.limit || window.label || 'codex')
        && sample.window === String(window.window || window.limit || window.label || 'primary')
        && Number(sample.reset) === reset
        && Number(sample.at) <= observedAt + 30000
        && (!windowStart || Number(sample.at) >= windowStart))
      .map((sample) => ({ ...sample, at: Number(sample.at), used: Number(sample.used) }))
      .sort((a, b) => a.at - b.at));
    const anchor = points[points.length - 1]?.at || observedAt;
    const full = fromPoints(points, remaining, reset, now, 'quota_window');
    const recent = (hours, scope) => fromPoints(points.filter((point) => point.at >= anchor - hours * 3600000), remaining, reset, now, scope);
    const forecasts = { quota_window: full, recent_24h: recent(24, 'recent_24h'), recent_2h: recent(2, 'recent_2h') };
    const span = points.length > 1 ? (points[points.length - 1].at - points[0].at) / 60000 : 0;
    const observation = { samples: points.length, minutes: Math.max(0, span), requiredMinutes: 15 };
    if (!full) return { ...base, state: 'learning', forecasts, observation };
    const secondsToReset = Math.max(0, (reset * 1000 - now) / 1000);
    return {
      ...base,
      state: full.slowSeconds !== null && full.slowSeconds < secondsToReset ? 'risk'
        : full.fastSeconds >= secondsToReset ? 'on_track' : 'uncertain',
      secondsToReset,
      forecast: full,
      forecasts,
      observation,
    };
  }

  return { mapCodexQuotaResponse, recordObservation, quotaOutlook };
});
