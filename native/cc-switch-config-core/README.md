# CC Switch headless Codex configuration core

This crate compiles the pinned CC Switch `config.rs`, `codex_config.rs`,
`error.rs`, and model-capability logic without its Tauri window runtime.

It is the first embedded runtime boundary for Subscription Lens routing:

- validates and atomically writes the Codex third-party provider shape;
- places the API key in the active provider's scoped bearer-token slot;
- preserves unrelated `config.toml` settings through CC Switch's writer;
- runs against `CC_SWITCH_TEST_HOME` in tests, never a user's Codex folder.

It intentionally does **not** start a local proxy. Proxy takeover and instant
hot-switching remain unavailable until the upstream proxy core can pass the
same isolated startup and recovery tests.
