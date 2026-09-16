'use strict';
// Run only after package validation: node scripts/retain-local-releases.cjs ROOT CHANNEL VERSION FOLDER
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const [rootArg,channel,version,folder]=process.argv.slice(2);
if(!rootArg||!['stable','preview'].includes(channel)||!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version||'')||!/^subscription-lens-[\w.-]+$/.test(folder||''))throw Error('Usage: ROOT stable|preview VERSION subscription-lens-VERSION-CHANNEL');
const root=fs.realpathSync(rootArg),manifest=path.join(root,'subscription-lens-retention.json');
function target(relative){if(!/^subscription-lens-[\w.-]+$/.test(relative))throw Error('Unexpected release folder');const full=path.resolve(root,relative);if(path.dirname(full)!==root||fs.lstatSync(full).isSymbolicLink()||fs.realpathSync(full)!==full)throw Error('Release path is not a direct, real child of ROOT');return full;}
function verify(release){const dir=target(release.path),sums=fs.readFileSync(path.join(dir,'SHA256SUMS.txt'),'utf8').trim().split(/\r?\n/);if(!sums.length)throw Error('Empty checksum manifest');for(const line of sums){const m=/^([a-f0-9]{64})\s+\*?([^\\/]+)$/i.exec(line);if(!m||m[2]==='..'||m[2]==='.')throw Error('Invalid checksum entry');const file=path.join(dir,m[2]);if(fs.lstatSync(file).isSymbolicLink())throw Error('Linked artifact');const digest=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(digest!==m[1].toLowerCase())throw Error('Checksum mismatch: '+m[2]);}}
const before=fs.existsSync(manifest)?JSON.parse(fs.readFileSync(manifest,'utf8')):{stable:null,preview:null,fallback:null};const next={...before,[channel]:{version,path:folder,checksums:'SHA256SUMS.txt'}};
if(channel==='stable'&&before.stable?.path!==folder)next.fallback=before.stable;
if(channel==='preview'&&!next.stable&&before.preview?.path!==folder)next.fallback=before.preview;
if(channel==='preview'&&next.stable)next.fallback=null;
const keep=[next.stable,next.preview,next.fallback].filter(Boolean);for(const release of keep)verify(release);
const obsolete=[before.stable,before.preview,before.fallback].filter(r=>r&&!keep.some(k=>k.path===r.path));
// Save the verified recovery set before removing superseded packages.
next.policy='Latest verified stable and preview; previous stable remains as fallback when no preview is retained.';next.updatedAt=new Date().toISOString();next.note=next.stable?(next.fallback?'Stable and fallback slots retained.':'Stable and preview slots retained.'):'No formally stable release exists; the previous preview remains the rollback copy.';
fs.writeFileSync(manifest+'.tmp',JSON.stringify(next,null,2)+'\n');fs.renameSync(manifest+'.tmp',manifest);
for(const release of obsolete){verify(release);const dir=target(release.path);const entries=fs.readdirSync(dir,{withFileTypes:true});if(entries.some(e=>!e.isFile()||e.isSymbolicLink()))throw Error('Refusing cleanup of a folder containing directories or links');for(const entry of entries)fs.unlinkSync(path.join(dir,entry.name));fs.rmdirSync(dir);}
console.log(JSON.stringify({retained:keep.map(r=>r.path),removed:obsolete.map(r=>r.path)},null,2));
