const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { DatabaseSync } = require('node:sqlite');
const root = process.argv[2] || path.resolve(__dirname, '..');
const services = path.join(root, 'native/cc-switch-runtime/src-tauri/src/services');
const stats = fs.readFileSync(path.join(services, 'usage_stats.rs'), 'utf8');
const helpers = fs.readFileSync(path.join(services, 'sql_helpers.rs'), 'utf8');
const method = stats.slice(stats.indexOf('pub fn get_model_stats('));
const query = method.match(/"(SELECT[\s\S]*?ORDER BY total_cost DESC)"/)[1];
const freshTemplate = helpers.match(/"(CASE \\[\s\S]*?ELSE \{prefix\}input_tokens END)"/)[1].replace(/\\\r?\n\s*/g, '');
const apps = JSON.parse(helpers.match(/CACHE_INCLUSIVE_APP_TYPES[^=]*= &([^;]+);/)[1]);
function fresh(alias) {
  return freshTemplate.replaceAll('{prefix}', alias+'.').replaceAll('{app_type_list}', apps.map(x=>`'${x}'`).join(','))
    .replaceAll('{INPUT_TOKEN_SEMANTICS_FRESH}', '2').replaceAll('{INPUT_TOKEN_SEMANTICS_TOTAL}', '1').replaceAll('{INPUT_TOKEN_SEMANTICS_LEGACY}', '0');
}
const substitutions = {fresh_input_detail:fresh('l'), fresh_input_rollup:fresh('r'), detail_model:'l.model', rollup_model:'r.model', detail_join:'', detail_where:'', rollup_join:'', rollup_where:''};
const sql = query.replace(/\{(\w+)\}/g, (_, key) => {
  assert.ok(Object.hasOwn(substitutions,key), `Unexpected SQL placeholder: ${key}`);
  return substitutions[key];
});
const db = new DatabaseSync(':memory:');
for (const table of ['proxy_request_logs','usage_daily_rollups']) db.exec(`CREATE TABLE ${table} (model TEXT, app_type TEXT, request_count INTEGER, input_tokens INTEGER, output_tokens INTEGER, cache_read_tokens INTEGER, cache_creation_tokens INTEGER, input_token_semantics INTEGER, total_cost_usd TEXT);`);
db.exec(`INSERT INTO proxy_request_logs VALUES ('model-a','codex',1,1000,100,500,0,1,'1.0');
 INSERT INTO usage_daily_rollups VALUES ('model-a','codex',2,300,100,600,0,2,'0.5');
 INSERT INTO proxy_request_logs VALUES ('model-b','claude',1,400,50,300,100,2,'0.1');`);
const rows = db.prepare(sql).all();
const a = rows.find(row=>row.model==='model-a');
assert.equal(a.request_count,3);
assert.equal(a.total_tokens,1000, 'CC Switch normalized total must retain its original meaning');
assert.equal(a.input_t+a.output_t+a.cache_read_t+a.cache_write_t,2100, 'Detail and rolled-up cache tokens must both be included');
assert.equal(a.cache_read_t,1100);
assert.equal(a.total_cost,1.5);
const b=rows.find(row=>row.model==='model-b');
assert.equal(b.input_t+b.output_t+b.cache_read_t+b.cache_write_t,850, 'Fresh-input providers must not have their cache tokens subtracted twice');
db.close();
const experience=fs.readFileSync(path.join(root,'native/subscription-lens-tauri/frontend/experience.js'),'utf8');
const line=experience.split('\n').find(line=>line.startsWith('const dateOnly='));
const dateOnly=vm.runInNewContext(line+'\ndateOnly',{locale:()=> 'en-US'});
for(const value of ['',null,undefined,'invalid']) assert.equal(dateOnly(value),'—');
assert.match(dateOnly('2026-09-26'),/2026/);
console.log('LINUX_COMPAT_CHECKS_PASSED: cached detail/rollup totals, fresh-input semantics, empty billing dates');
