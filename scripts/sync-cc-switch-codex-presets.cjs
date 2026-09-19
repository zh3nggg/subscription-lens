'use strict';

// Keep the desktop provider picker sourced from the pinned CC Switch runtime.
// This intentionally extracts only presentation-safe preset metadata. Secrets
// are never present in the upstream preset file and are never generated here.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'native', 'cc-switch-runtime', 'src', 'config', 'codexProviderPresets.ts');
const outputPath = path.join(root, 'src', 'ui', 'cc-switch-codex-presets.js');
const source = fs.readFileSync(sourcePath, 'utf8');

function quoted(block, key) {
  return (block.match(new RegExp(`\\b${key}:\\s*["']([^"']*)["']`)) || [])[1] || '';
}

function balancedObjects(text, start) {
  const objects = []; let depth = 0; let begin = -1; let quote = ''; let escaped = false; let line = false; let block = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (line) { if (ch === '\n') line = false; continue; }
    if (block) { if (ch === '*' && next === '/') { block = false; i++; } continue; }
    if (quote) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === quote) quote = ''; continue; }
    if (ch === '/' && next === '/') { line = true; i++; continue; }
    if (ch === '/' && next === '*') { block = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '{') { if (depth === 0) begin = i; depth++; continue; }
    if (ch === '}') { depth--; if (depth === 0 && begin >= 0) { objects.push(text.slice(begin, i + 1)); begin = -1; } continue; }
    if (ch === ']' && depth === 0) break;
  }
  return objects;
}

function arrayBody(block, marker) {
  const start = block.indexOf(marker); if (start < 0) return '';
  const bracket = block.indexOf('[', start); if (bracket < 0) return '';
  let depth = 0, quote = '', escaped = false;
  for (let i = bracket; i < block.length; i++) {
    const ch = block[i];
    if (quote) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === quote) quote = ''; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '[') depth++;
    if (ch === ']' && --depth === 0) return block.slice(bracket + 1, i);
  }
  return '';
}

const listStart = source.indexOf('export const codexProviderPresets');
const assignment = source.indexOf('=', listStart);
const arrayStart = source.indexOf('[', assignment);
if (listStart < 0 || arrayStart < 0) throw new Error('CC Switch Codex presets were not found');

const presets = balancedObjects(source, arrayStart).map((block, index) => {
  const generated = block.match(/generateThirdPartyConfig\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/s);
  const literal = block.match(/config:\s*`([\s\S]*?)`/);
  const config = literal?.[1] || '';
  const name = quoted(block, 'name');
  const endpointBody = arrayBody(block, 'endpointCandidates');
  const endpoint = generated?.[2] || (config.match(/base_url\s*=\s*["']([^"']+)/) || [])[1] || (endpointBody.match(/["'](https?:\/\/[^"']+)/) || [])[1] || '';
  const configModel = (config.match(/^model\s*=\s*["']([^"']+)/m) || [])[1] || '';
  const catalogBody = arrayBody(block, 'modelCatalog(');
  const catalogModels = [];
  for (const match of catalogBody.matchAll(/\bmodel:\s*["']([^"']+)["']/g)) catalogModels.push(match[1]);
  if (!catalogModels.length) for (const match of catalogBody.matchAll(/["']([^"']+)["']/g)) if (!match[1].includes(' ') && !match[1].includes(':')) catalogModels.push(match[1]);
  const model = generated?.[3] || configModel || catalogModels[0] || '';
  const apiFormat = quoted(block, 'apiFormat') || 'openai_responses';
  const category = quoted(block, 'category') || (block.includes('isOfficial: true') ? 'official' : 'others');
  return {
    id: index === 0 ? 'codex' : `ccs-${index}`,
    upstreamIndex: index,
    name,
    baseUrl: endpoint,
    model,
    models: [...new Set(catalogModels)].slice(0, 30),
    category,
    protocol: apiFormat === 'openai_chat' ? 'chat' : apiFormat === 'anthropic' ? 'anthropic' : 'responses',
    websiteUrl: quoted(block, 'websiteUrl'),
    apiKeyUrl: quoted(block, 'apiKeyUrl'),
    icon: quoted(block, 'icon'),
    iconColor: quoted(block, 'iconColor'),
    partner: /\bisPartner:\s*true/.test(block),
    primePartner: /\bprimePartner:\s*true/.test(block),
    official: /\bisOfficial:\s*true/.test(block),
  };
}).filter(item => item.name);

presets.push({ id: 'custom', upstreamIndex: -1, name: 'Custom', baseUrl: '', model: '', models: [], category: 'custom', protocol: 'responses', websiteUrl: '', apiKeyUrl: '', icon: '', iconColor: '', partner: false, primePartner: false, official: false });
const revision = require('node:child_process').execFileSync('git', ['-C', path.dirname(path.dirname(sourcePath)), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const payload = { source: 'CC Switch codexProviderPresets', revision, generatedAt: new Date().toISOString(), presets };
fs.writeFileSync(outputPath, `'use strict';\n// Generated from the pinned CC Switch source. Do not edit manually.\nglobalThis.CCSwitchCodexPresets=${JSON.stringify(payload, null, 2)};\n`);
console.log(`Synced ${presets.length - 1} CC Switch Codex presets from ${revision.slice(0, 12)}`);
