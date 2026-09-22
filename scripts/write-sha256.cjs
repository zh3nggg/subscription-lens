'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const dist = path.resolve(__dirname, '..', 'dist');
const version = require('../package.json').version;
const packages = fs.readdirSync(dist)
  .filter(name => name.includes(`-${version}-`) && /\.(?:dmg|exe|zip)$/.test(name))
  .sort();
if (!packages.length) throw new Error(`No release packages found in ${dist}.`);

function sha256(file) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(file);
    input.on('error', reject);
    input.on('data', chunk => hash.update(chunk));
    input.on('end', () => resolve(hash.digest('hex')));
  });
}

(async () => {
  const lines = [];
  for (const name of packages) lines.push(`${await sha256(path.join(dist, name))}  ${name}`);
  fs.writeFileSync(path.join(dist, 'SHA256SUMS.txt'), `${lines.join('\n')}\n`, 'utf8');
  process.stdout.write(`Wrote SHA256SUMS.txt for ${packages.length} package(s).\n`);
})().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
