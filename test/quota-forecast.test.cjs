'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { mapCodexQuotaResponse, recordObservation, quotaOutlook } = require('../native/subscription-lens-tauri/frontend/quota-forecast.js');

const now = Date.parse('2026-09-24T12:00:00Z');
const current = {
  label: 'seven_day', limit: 'seven_day', window: 'seven_day', used: 40,
  resetsAt: Math.floor((now + 3 * 86400000) / 1000), minutes: 7 * 1440,
  observedAt: new Date(now).toISOString(),
};

test('Codex quota response timestamp reaches each window so live remaining quota is shown', () => {
  const quota = mapCodexQuotaResponse({
    success: true,
    queriedAt: now,
    tiers: [{ name: 'seven_day', utilization: 40, resetsAt: new Date(current.resetsAt * 1000).toISOString() }],
  });
  assert.equal(quota.observedAt, new Date(now).toISOString());
  assert.equal(quota.windows[0].observedAt, quota.observedAt);
  const outlook = quotaOutlook(quota.windows[0], [], { now, identity: 'account-a', live: true });
  assert.equal(outlook.state, 'learning');
  assert.equal(outlook.remaining, 60);
  assert.equal(outlook.secondsToReset, 3 * 86400);
});

test('quota samples are retained, deduplicated by minute, and partitioned by account', () => {
  let history = recordObservation([], { observedAt: new Date(now - 20 * 60000).toISOString(), windows: [{ ...current, observedAt: undefined, used: 20 }] }, 'account-a', now);
  history = recordObservation(history, { observedAt: new Date(now - 20 * 60000 + 1000).toISOString(), windows: [{ ...current, observedAt: undefined, used: 21 }] }, 'account-a', now);
  history = recordObservation(history, { observedAt: new Date(now - 10 * 60000).toISOString(), windows: [{ ...current, observedAt: undefined, used: 30 }] }, 'account-a', now);
  history = recordObservation(history, { observedAt: new Date(now - 4.75 * 60000).toISOString(), windows: [{ ...current, observedAt: undefined, used: 35 }] }, 'account-a', now);
  history = recordObservation(history, { observedAt: new Date(now - 2 * 60000).toISOString(), windows: [{ ...current, observedAt: undefined, used: 5 }] }, 'account-b', now);
  assert.equal(history.filter((row) => row.identity === 'account-a').length, 3);
  assert.equal(history.find((row) => row.identity === 'account-a' && row.at === now - 20 * 60000 + 1000).used, 21);
  const result = quotaOutlook(current, history, { now, identity: 'account-a', live: true });
  assert.ok(result.forecast);
  assert.equal(result.forecast.samples, 3);
  assert.equal(result.state, 'risk');
});

test('forecast stays in learning state until samples span fifteen minutes', () => {
  const quota = { ...current, observedAt: new Date(now).toISOString() };
  const history = [-10, -5, -1].map((minutes, index) => ({
    identity: 'account-a', limit: current.limit, window: current.window,
    reset: current.resetsAt, at: now + minutes * 60000, used: 20 + index * 5,
  }));
  const result = quotaOutlook(quota, history, { now, identity: 'account-a', live: true });
  assert.equal(result.state, 'learning');
  assert.equal(result.forecast, null);
  assert.equal(result.observation.samples, 3);
  assert.equal(result.observation.minutes, 9);
});

test('forecast excludes another account and previous reset windows', () => {
  const quota = { ...current, observedAt: new Date(now).toISOString() };
  const history = [-30, -20, -1].flatMap((minutes, index) => [
    { identity: 'other', limit: current.limit, window: current.window, reset: current.resetsAt, at: now + minutes * 60000, used: 20 + index * 5 },
    { identity: 'account-a', limit: current.limit, window: current.window, reset: current.resetsAt - 86400, at: now + minutes * 60000, used: 20 + index * 5 },
  ]);
  assert.equal(quotaOutlook(quota, history, { now, identity: 'account-a', live: true }).state, 'learning');
});
