# Embedded CC Switch router host

This binary is distributed inside Subscription Lens. It links directly to the
pinned CC Switch Rust runtime and exposes a local stdio control channel to the
Electron main process.

It delegates provider import, provider switching, proxy startup, Codex
takeover, recovery and protocol conversion to CC Switch. It never accepts an
API key through a command line or browser deep link.

The build is intentionally not yet wired into `electron-builder`: it must first
pass a clean-room test that starts the sidecar, activates a temporary Codex
home, kills and restarts the sidecar, then confirms the upstream recovery path
restores or reclaims configuration safely.
