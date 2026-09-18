//! Headless reuse of CC Switch's Codex configuration writer.
//!
//! The included modules are compiled from the pinned upstream source tree.
//! This deliberately excludes the Tauri window runtime; it is a configuration
//! transaction component, not a replacement implementation.

#[path = "../../cc-switch-runtime/src-tauri/src/error.rs"]
pub mod error;
#[path = "../../cc-switch-runtime/src-tauri/src/model_capabilities.rs"]
pub mod model_capabilities;
#[path = "../../cc-switch-runtime/src-tauri/src/config.rs"]
pub mod config;
#[path = "../../cc-switch-runtime/src-tauri/src/codex_config.rs"]
pub mod codex_config;

pub mod app_store {
    use std::path::PathBuf;
    pub fn get_app_config_dir_override() -> Option<PathBuf> { None }
}

pub mod settings {
    use std::path::PathBuf;
    pub fn get_claude_override_dir() -> Option<PathBuf> { None }
    // This is intentionally private to Subscription Lens. It makes the
    // upstream writer testable without ever redirecting normal Codex traffic.
    // Production never sets this variable, so CC Switch keeps its standard
    // ~/.codex location and behaviour.
    pub fn get_codex_override_dir() -> Option<PathBuf> {
        std::env::var_os("SUBSCRIPTION_LENS_CODEX_HOME").map(PathBuf::from)
    }
    pub fn preserve_codex_official_auth_on_switch() -> bool { true }
    pub fn unify_codex_session_history() -> bool { false }
    pub fn reload_settings() -> Result<(), crate::error::AppError> { Ok(()) }
}

// `model_capabilities` shares this marker with the desktop configuration
// module. The headless runtime only needs the value, not desktop integration.
pub mod claude_desktop_config {
    pub const ONE_M_CONTEXT_MARKER: &str = "[1M]";
}

#[derive(Debug, Clone)]
pub struct CodexRoute {
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    pub models: Vec<String>,
}

fn quoted(value: &str) -> Result<String, error::AppError> {
    serde_json::to_string(value).map_err(|source| error::AppError::JsonSerialize { source })
}

/// Builds the live configuration shape used by CC Switch for a third-party
/// Codex provider. The upstream writer adds the scoped bearer-token field and
/// preserves unrelated user settings atomically.
pub fn apply_codex_route(route: &CodexRoute) -> Result<(), error::AppError> {
    let base_url = route.base_url.trim().trim_end_matches('/');
    let model = route.model.trim();
    if !(base_url.starts_with("https://") || base_url.starts_with("http://")) {
        return Err(error::AppError::InvalidInput("Provider URL must use HTTP or HTTPS.".into()));
    }
    if model.is_empty() || model.chars().any(char::is_control) {
        return Err(error::AppError::InvalidInput("Model name is invalid.".into()));
    }
    if route.api_key.trim().is_empty() {
        return Err(error::AppError::InvalidInput("API key is required.".into()));
    }
    let config = format!(
        "model = {}\nmodel_provider = \"subscription_lens\"\n\n[model_providers.subscription_lens]\nname = \"Subscription Lens\"\nbase_url = {}\nwire_api = \"responses\"\nrequires_openai_auth = false\n",
        quoted(model)?, quoted(base_url)?,
    );
    // Reuse CC Switch's actual model-catalog generator. It writes the
    // cc-switch-owned catalog beside config.toml and adds the safe relative
    // model_catalog_json pointer, so Codex's /model menu lists this provider's
    // models after restart.
    let models: Vec<serde_json::Value> = route.models.iter()
        .map(|value| value.trim())
        .filter(|value| !value.is_empty() && !value.chars().any(char::is_control))
        .take(100)
        .map(|value| serde_json::json!({ "model": value }))
        .collect();
    let models = if models.is_empty() { vec![serde_json::json!({ "model": model })] } else { models };
    let settings = serde_json::json!({ "modelCatalog": { "models": models } });
    let config = codex_config::prepare_codex_config_text_with_model_catalog(
        &settings,
        &config,
        codex_config::CodexCatalogToolProfile::NativeResponses,
    )?;
    let auth = serde_json::json!({ "OPENAI_API_KEY": route.api_key });
    codex_config::write_codex_live_for_provider(Some("custom"), &auth, Some(&config))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn route_writer_uses_scoped_provider_credentials() {
        let home = std::env::temp_dir().join(format!("subscription-lens-cc-core-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&home);
        std::env::set_var("SUBSCRIPTION_LENS_CODEX_HOME", &home);
        apply_codex_route(&CodexRoute {
            base_url: "https://example.test/v1".into(),
            api_key: "test-secret".into(),
            model: "example-model".into(),
            models: vec!["example-model".into(), "example-fast".into()],
        }).unwrap();
        let saved = std::fs::read_to_string(codex_config::get_codex_config_path()).unwrap();
        assert!(saved.contains("model_provider = \"subscription_lens\""));
        assert!(saved.contains("experimental_bearer_token"));
        assert!(!saved.contains("openai_base_url"));
        assert!(saved.contains("model_catalog_json = \"cc-switch-model-catalog.json\""));
        let catalog = std::fs::read_to_string(codex_config::get_codex_model_catalog_path()).unwrap();
        assert!(catalog.contains("example-fast"));
        let _ = std::fs::remove_dir_all(home);
        std::env::remove_var("SUBSCRIPTION_LENS_CODEX_HOME");
    }
}
