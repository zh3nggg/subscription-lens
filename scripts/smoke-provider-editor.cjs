'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { _electron: electron } = require('playwright');

async function main() {
  const root = path.resolve(__dirname, '..');
  const base = path.join(root, 'test-results');
  await fs.mkdir(base, { recursive: true });
  const temp = await fs.mkdtemp(path.join(base, 'provider-editor-'));
  const data = path.join(temp, 'data');
  const codex = path.join(temp, 'codex');
  await fs.mkdir(codex, { recursive: true });
  const app = await electron.launch({
    executablePath: process.env.LENS_TEST_EXE || require('electron'),
    args: process.env.LENS_TEST_EXE ? [] : [root],
    env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined, LENS_DATA_DIR: data, CODEX_HOME: codex, LENS_TEST_HIDDEN: '1' },
  });
  const errors = [];
  try {
    const page = await app.firstWindow();
    page.setDefaultTimeout(20000);
    page.on('pageerror', error => errors.push(error.message));
    await page.click('aside [data-page=providers]');
    await page.click('[data-provider-action=new]');
    await page.waitForSelector('.ccs-preset-grid');
    assert.ok(await page.locator('[data-provider-preset]').count() >= 80);
    await page.fill('#provider-preset-search', 'DeepSeek');
    const deepseek = page.locator('[data-provider-preset]', { hasText: 'DeepSeek' });
    assert.equal(await deepseek.count(), 1);
    await deepseek.click();
    assert.equal(await page.inputValue('#provider-preset'), 'ccs-45');
    assert.equal(await page.inputValue('#provider-base-url'), 'https://api.deepseek.com');
    assert.equal(await page.inputValue('#provider-model'), 'deepseek-v4-flash');
    assert.equal(await page.locator('[data-provider-mapping-upstream]').count(), 2);
    await page.fill('#provider-api-key', 'ui-state-test-key');
    await page.click('[data-provider-preset-sort]');
    assert.equal(await page.inputValue('#provider-api-key'), 'ui-state-test-key');
    await page.screenshot({ path: path.join(base, 'provider-editor-cc-switch.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log('CC Switch provider editor preset, mapping and draft persistence: passed');
  } finally {
    await app.close();
    await fs.rm(temp, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
