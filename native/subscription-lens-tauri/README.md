# Subscription Lens Tauri host

This is the Subscription Lens Tauri host. It compiles the pinned CC Switch
Tauri library and bundles the original CC Switch React provider manager into
the same executable, so provider and authentication state has one owner from
the first startup.

The `sublens-host` feature makes the runtime load this crate's
`tauri.conf.json`. It keeps the Subscription Lens renderer as the app shell:
sidebar navigation, overview cards, quota panels, distribution chart, activity
tabs, projects and sessions retain the Electron layout. Provider persistence,
OAuth account management, switch transactions, rollback logic, local proxy and
usage importers still come from the CC Switch runtime and database.

The checked-in `frontend/` and `tauri-bridge.js` are the active Tauri renderer.
They preserve the established Subscription Lens visual language for monitoring.
The Route page opens the bundled, original CC Switch provider manager for every
provider operation. The manager is generated into `frontend/ccswitch/` during
the build and is deliberately not checked in. The Electron application remains
a fallback build during the transition; it is not part of the Tauri provider path.

OpenAI Official account login, account selection, logout, provider creation,
model catalogs, API-key storage, connectivity checks and deletion use the
original CCS UI, command boundary and database. In particular, OpenAI Official
uses the CCS-managed Codex OAuth account, not the Codex GUI's current login.
Subscription Lens does not keep a parallel provider store.

On Windows the host embeds the Common Controls v6 manifest required by the CCS
dialog runtime. Its WebView2 profile is isolated under the app's local data
directory (`main/webview`) so startup does not reuse a locked CCS/Electron
profile.

The host intentionally has no `devUrl`. Debug executables load the checked-in
Subscription Lens renderer from the embedded asset protocol, so double-clicking
the binary does not depend on a development server.

## Local verification

```text
cargo check --target-dir C:\Users\Kanto\AppData\Local\Temp\sublens-tauri-target
```

The command must finish successfully before this host is used for packaging.

From the repository root, the same check can be run with
`scripts/build-tauri-migration-host.ps1 -Action check`; use `-Action build`
when a local executable is needed.

The verified debug executable is written to the selected target directory as
`debug/subscription-lens-tauri.exe`; it is not an installer and is not yet the
release artifact.
