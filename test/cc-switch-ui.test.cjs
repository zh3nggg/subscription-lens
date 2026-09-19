'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

test('CC Switch Codex presets are bundled from the pinned runtime', () => {
  delete globalThis.CCSwitchCodexPresets;
  require('../src/ui/cc-switch-codex-presets.js');
  const payload = globalThis.CCSwitchCodexPresets;
  assert.match(payload.revision, /^[0-9a-f]{40}$/);
  assert.ok(payload.presets.length >= 80);
  const deepseek = payload.presets.find(item => item.name === 'DeepSeek');
  assert.equal(deepseek.baseUrl, 'https://api.deepseek.com');
  assert.equal(deepseek.model, 'deepseek-v4-flash');
  assert.deepEqual(deepseek.models, ['deepseek-v4-flash', 'deepseek-v4-pro']);
});
