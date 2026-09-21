# Subscription Lens Tauri host

This is the migration host for the Tauri build. It calls the pinned CC Switch
Tauri library directly so the provider and authentication lifecycle is owned by
CC Switch from the first executable startup.

The `sublens-host` feature makes the runtime load this crate's
`tauri.conf.json`, so the host can use a Subscription Lens renderer while all
CCS commands remain registered by the same Rust binary. The checked-in
`frontend/` now reuses the Electron renderer's complete page shell,
navigation, statistics, usage, settings, and visual styles. The
`tauri-bridge.js` adapter preserves the existing `window.lens` contract while
translating calls to CCS's native usage, provider, settings, and authentication
commands; no JSON-lines sidecar or local development server is required.

The shell also reads and refreshes the managed `codex_oauth` account list and
can invoke managed logout. These calls require the explicit CCS auth provider
identifier, matching the upstream auth API rather than relying on the current
Codex frontend session.

The login button uses the same CCS device authorization and polling commands,
so a user can complete the managed Codex login from this window before
switching back to OpenAI Official.

Each managed account can also be selected as the default or removed through
the native CCS account commands.

Provider cards expose a read-only `settingsConfig` inspector. It shows the
exact CCS-persisted object instead of reconstructing provider fields in the
Sublens layer; this is the handoff point for the upcoming CCS editor surface.

The migration frontend also has a constrained Codex provider creation form. It
writes the same `{ auth, config }` shape used by CCS and keeps the new provider
out of the live config until the native CCS switch flow is explicitly used.
This is a migration checkpoint, not a replacement for the full CCS editor.

The provider form also accepts optional `modelCatalog.models` JSON and validates
it before writing. This keeps model mapping data in the same shape consumed by
the CCS Codex form, without making an unapproved network request to discover
models.

Existing providers can be edited through CCS `update_provider`. Auth values are
redacted in the inspector, and edits require a newly entered replacement key;
the renderer never reuses or displays a stored credential.

Non-built-in providers can also be removed through CCS `delete_provider`; the
UI leaves built-in providers protected.

Each provider can run the CCS endpoint speed test. The renderer passes only the
stored `base_url` to `test_api_endpoints`; it does not send API keys or
implement a second network client.

The Electron application remains available as a fallback build, while this
Tauri renderer uses the same production visual language and page interactions.

On Windows the host embeds the Common Controls v6 manifest required by the CCS
dialog runtime. Its WebView2 profile is isolated under the app's local data
directory (`main/webview`) so startup does not reuse a locked CCS/Electron
profile.

The host intentionally has no `devUrl`: debug executables still load the
checked-in `frontend/` from the embedded asset protocol, so double-clicking the
binary never depends on a separate server listening on `localhost:1420`.

Renderer startup and WebView-side failures are appended to
`~/.cc-switch/logs/subscription-lens-frontend.log`, alongside the native CCS
log. The page also shows the underlying error when its initial query fails.

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
