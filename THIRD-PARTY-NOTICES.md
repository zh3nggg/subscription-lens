# Third-party notices

## codex-usage — vendored source, not enabled in the desktop release

- Project: https://github.com/zJay26/codex-usage
- Commit: `733df6216a0427d43a343a9210539be91b90e5bb` (2.6.4)
- Copyright (c) 2026 Codex Usage contributors
- License: MIT; full text in [codex-usage MIT license](docs/licenses/codex-usage-MIT.txt).
- Copied components: usage, store, model, timezone and pricing packages, including tests and fixtures. Changes and verification are recorded in [UPSTREAM.md](native/usage-engine/UPSTREAM.md).
- Go-derived timezone material retains [GO-LICENSE](native/usage-engine/internal/timezone/GO-LICENSE).

This source is included for the next accounting-engine integration. Version 1.4.0-beta.7 does not execute or bundle the experimental native binary. Passing upstream tests does not establish desktop feature parity.

## CodexBar — product reference

- Project: https://github.com/steipete/CodexBar
- License: MIT
- Referenced for quota, reset, account and desktop interaction requirements. No CodexBar source code or assets are included in this release. This is a design reference, not an endorsement or affiliation.

## Desktop runtime

The Windows 3.0.0 app uses Tauri and WebView2. Earlier Electron distributions include Electron and Chromium license notices as `LICENSE.electron.txt` and `LICENSES.chromium.html`. Development dependencies and versions are recorded in package-lock.json. The application itself is licensed under MIT; upstream code retains its own notices.

## CC Switch — provider manager and routing runtime

- Project: https://github.com/farion1231/cc-switch
- Reference commit: `06082e189d65e6d6dbadc35dacdac1ce6c79d89a`
- License: MIT
- Copyright: © 2025 Jason Young. The complete upstream notice is retained in `native/cc-switch-runtime/LICENSE`.
- The complete upstream source is included as the `native/cc-switch-runtime` Git submodule, pinned to the revision above. Its MIT copyright and license must be retained in every source or binary distribution that includes the runtime.
- The Tauri edition compiles the upstream provider, proxy, takeover, recovery and protocol-conversion components into the Subscription Lens executable. It also bundles the original CC Switch React provider-manager renderer for all Codex provider creation, editing, OAuth authorization, model mapping, testing and switching. Subscription Lens retains its own monitoring shell, while provider configuration is rendered and persisted by CC Switch. The resulting binary distribution must retain this notice and the upstream MIT license. This is not an endorsement or affiliation.
