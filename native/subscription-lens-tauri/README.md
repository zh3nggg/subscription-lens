# Subscription Lens Tauri host

This is the Subscription Lens Tauri host. It compiles the pinned CC Switch
Tauri library and React application into the same executable, so provider and
authentication state has one owner from the first startup.

The `sublens-host` feature makes the runtime load this crate's
`tauri.conf.json`. The host bundles CC Switch's provider list, add/edit dialogs,
OAuth account management, database, switch transactions, rollback logic, local
proxy and usage importers. Subscription Lens changes the product configuration,
starts on Codex and exposes the native statistics dashboard as a top-level page.
The statistics read the same CCS database that records routed requests and
imports Codex sessions.

The legacy checked-in `frontend/` and `tauri-bridge.js` are migration reference
files only. `frontendDist` does not select them and provider operations never
pass through them. The Electron application remains a fallback build during the
transition; it is not part of the Tauri provider path.

OpenAI Official account login, account selection, logout, provider creation,
model catalogs, API-key storage, connectivity checks and deletion are the
upstream CCS screens and commands. Subscription Lens does not reconstruct their
payloads or keep a parallel provider store.

On Windows the host embeds the Common Controls v6 manifest required by the CCS
dialog runtime. Its WebView2 profile is isolated under the app's local data
directory (`main/webview`) so startup does not reuse a locked CCS/Electron
profile.

The host intentionally has no `devUrl`. Debug executables load the compiled
React renderer from the embedded asset protocol, so double-clicking the binary
does not depend on a development server.

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
