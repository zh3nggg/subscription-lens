'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');

test('desktop source contains macOS-native Codex discovery and menu integration',()=>{
  const account=fs.readFileSync(path.resolve(__dirname,'../src/core/account.cjs'),'utf8');
  const main=fs.readFileSync(path.resolve(__dirname,'../src/main.cjs'),'utf8');
  assert.match(account,/ChatGPT\.app/);
  assert.match(account,/Codex\.app/);
  assert.match(account,/aarch64-apple-darwin|\/opt\/homebrew\/bin\/codex/);
  assert.match(main,/role:'appMenu'/);
  assert.match(main,/setTemplateImage\(true\)/);
});

test('native router dependencies keep Windows crates target-scoped',()=>{
  const manifest=fs.readFileSync(path.resolve(__dirname,'../native/cc-switch-router-core/Cargo.toml'),'utf8');
  assert.match(manifest,/\[target\.'cfg\(target_os = "windows"\)'\.dependencies\]/);
  assert.match(manifest,/windows-sys/);
  assert.match(manifest,/winreg/);
});
