# Contributing

Use an issue for a bug or proposed change. Never attach authentication files, cookies, API keys, raw session logs, or a real usage database. A synthetic fixture and redacted error message are usually sufficient.

## Desktop development

Windows x64 and Node.js 24:

```sh
npm ci
npm test
npm start
```

Before a UI change is merged, run `node scripts/smoke-i18n.cjs` and `node scripts/smoke-product.cjs`. These use isolated synthetic data. Keep Chinese, English and Dutch entries in src/locales.json aligned. The real-account smoke test is manual and must never run in CI.

Do not commit node_modules, dist, test-results, local account files or databases. Release binaries belong in GitHub Releases.

## Native accounting engine

The source under native/usage-engine is experimental and pinned to an upstream commit. It is not part of the active desktop data path. Preserve upstream notices and record changes in UPSTREAM.md. Run `go test ./...` from that directory when changing it. Do not enable the engine without migration and desktop integration tests.

## Releases

The repository's manual release workflow builds a Windows installer and ZIP, runs packaged synthetic UI checks and uploads a draft prerelease with SHA256 hashes. The maintainer reviews that draft before publishing. Windows builds are currently unsigned. Do not label incomplete functionality as supported.

Run `node scripts/smoke-monitor.cjs` for provider connectors and responsive dashboards. Keep the installer GUID and appId unchanged for in-place upgrades. After verifying new artifacts, use `node scripts/retain-local-releases.cjs ROOT stable|preview VERSION FOLDER` to verify the new retention set before retiring superseded local packages.
