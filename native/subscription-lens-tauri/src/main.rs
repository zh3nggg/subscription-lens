//! Subscription Lens Tauri host.
//!
//! The first migration stage deliberately delegates the desktop runtime to
//! the pinned CC Switch Tauri library. Provider storage, OAuth accounts,
//! provider binding, proxy takeover, switching and rollback therefore remain
//! in the upstream command boundary while the Sublens renderer is migrated.

fn main() {
    cc_switch::run();
}
