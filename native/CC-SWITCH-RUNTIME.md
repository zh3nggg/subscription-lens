# CC Switch routing runtime

`cc-switch-runtime` is the pinned upstream CC Switch source tree embedded in
Subscription Lens for native Codex routing. It remains a Git submodule so the
upstream implementation, revision and license can be audited independently.

- Upstream: `https://github.com/farion1231/cc-switch`
- Pinned revision: `06082e189d65e6d6dbadc35dacdac1ce6c79d89a`
- License: MIT, copyright Jason Young

## Embedded design

`subscription-lens-router.exe` is a windowless host for the upstream CC Switch
runtime. It compiles the following upstream paths directly: provider service,
proxy service, configuration takeover and recovery, response forwarding,
protocol conversion and switch locks. The Tauri/WebView window layer is not
included; Electron owns the user interface and talks to the sidecar through a
private JSON-lines pipe.

The sidecar keeps its CC Switch database and settings beneath Subscription
Lens' app-data directory. It sets CC Switch's `codexConfigDir` to the selected
real Codex directory, so it never treats the isolated runtime directory as a
second Codex installation.

## Routing lifecycle

1. The first third-party activation saves a recoverable SubLens snapshot and
   asks the CC Switch provider service to construct the provider configuration.
2. CC Switch performs its transactional local-proxy takeover. Its own backup,
   switch locks, recovery and protocol converters stay in control of the
   loopback route.
3. A later activation uses CC Switch's hot-switch path. The loopback endpoint
   stays in place, so Codex GUI/CLI does not need another restart.
4. Stopping routing, selecting OpenAI Official, or exiting Subscription Lens
   stops the sidecar and restores the pre-routing SubLens snapshot.

The live client configuration retains a ChatGPT-compatible local route while
CC Switch supplies the selected provider's upstream model at forwarding time.
This is what allows an existing ChatGPT-authenticated Codex task to keep its
official model slug while routing to a compatible third-party API. The sidecar
never edits Codex conversation databases or session state.

## Packaging gate

`npm run verify:cc-switch-runtime` checks the pinned revision and MIT license.
`npm run build:router` builds and stages the headless sidecar.
`npm run verify:router-sidecar` starts it in an isolated home and requires a
status reply. `node scripts/test-embedded-cc-switch.mjs` verifies takeover, hot switch
and restore against a disposable fake Codex directory; it never reads the
user's credentials or configuration.

