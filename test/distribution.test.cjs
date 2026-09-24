'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('overview distribution uses multi-device models instead of local model data', () => {
  const code = fs.readFileSync(path.resolve(__dirname, '../native/subscription-lens-tauri/frontend/distribution.js'), 'utf8');
  const context = {
    overview: () => '<div class="overview-footer"></div>',
    state: {
      multi: false,
      deviceView: 'multi',
      data: {
        settings: { roots: ['codex'] },
        stats: { records: 1 },
        modelProviders: [{ key: 'OpenAI:gpt-5.6-sol', provider: 'OpenAI', model: 'gpt-5.6-sol', tokens: 10, events: 1, usd: 0.01 }],
        deviceCloud: { models: [
          { model: 'deepseek-flash', tokens: 70, events: 2, usd: null },
          { model: 'claude-sonnet', tokens: 30, events: 1, usd: 0.02 },
        ] },
      },
    },
    document: { addEventListener() {}, querySelectorAll: () => [] },
    t: (text) => text,
    esc: (text) => String(text ?? ''),
    compact: (value) => String(value),
    money: (value) => value == null ? '—' : `$${Number(value).toFixed(2)}`,
    decimal: (value) => Number(value).toFixed(1),
    fmt: { format: (value) => String(value) },
  };

  vm.runInNewContext(code, context, { filename: 'distribution.js' });
  const html = context.overview();

  assert.match(html, /DeepSeek/);
  assert.match(html, /Anthropic/);
  assert.doesNotMatch(html, /OpenAI/);
  assert.match(html, /供应商用量/);
  assert.equal((html.match(/<path /g) || []).length, 2, 'one slice should render for each device provider');
  assert.match(html, /100/);
});
