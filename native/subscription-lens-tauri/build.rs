fn main() {
    // Generate the Tauri Windows resources from this host's own config.  The
    // embedded CC Switch runtime has its own build script, but its resources
    // must not determine the Subscription Lens executable icon.
    // This host links the runtime as a library, so Cargo does not expose the
    // `DEP_TAURI_DEV` marker that tauri-build normally receives from a direct
    // Tauri dependency.  The migration host is always a development-style
    // binary, which is the same mode used by this local build script.
    std::env::set_var("DEP_TAURI_DEV", "true");
    let windows = tauri_build::WindowsAttributes::new()
        // Without Common Controls v6 Windows resolves TaskDialogIndirect
        // against comctl32 v5 and the executable exits before Tauri creates a
        // window.
        .app_manifest(include_str!("common-controls.manifest"));
    tauri_build::try_build(tauri_build::Attributes::new().windows_attributes(windows))
        .expect("failed to generate Tauri resources");
}
