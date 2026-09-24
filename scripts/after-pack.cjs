'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

module.exports = async context => {
  if (context.electronPlatformName !== 'darwin') return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync('/usr/bin/xattr', ['-cr', appPath]);
  const router = path.join(appPath, 'Contents', 'Resources', 'app.asar.unpacked', 'assets', 'router', 'subscription-lens-router');
  if (!fs.existsSync(router)) throw new Error(`Packaged CC Switch router is missing: ${router}`);
  fs.chmodSync(router, 0o755);
};
