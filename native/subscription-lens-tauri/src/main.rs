//! Subscription Lens Tauri host.
//!
//! The first migration stage deliberately delegates the desktop runtime to
//! the pinned CC Switch Tauri library. Provider storage, OAuth accounts,
//! provider binding, proxy takeover, switching and rollback therefore remain
//! in the upstream command boundary while the Sublens renderer is migrated.

// Keep GUI launches (including debug builds) from opening an attached console
// window on Windows. Diagnostics are written through the app's configured log.
#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

fn main() {
    cc_switch::run();
}
