# Embedded CC Switch router host

This binary is distributed inside Subscription Lens. It links directly to the
pinned CC Switch Rust runtime and exposes a local stdio control channel to the
Electron main process.

It delegates provider import, provider switching, proxy startup, Codex
takeover, recovery and protocol conversion to CC Switch. It never accepts an
API key through a command line or browser deep link.

The release build is staged under `assets/router/` and unpacked beside the
Electron ASAR. Windows uses `subscription-lens-router.exe`; Apple Silicon
macOS uses the executable `subscription-lens-router`. Packaging is gated by an
isolated status check and a clean-room takeover, hot-switch, and official
restore integration test.
