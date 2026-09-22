//! Headless embedding boundary for CC Switch's Codex routing runtime.
//!
//! Modules below are compiled directly from the pinned upstream source.  The
//! only replacement is the Tauri window facade: a sidecar has no window, and
//! CC Switch already treats its AppHandle as optional in the proxy server.

#[path = "../../cc-switch-runtime/src-tauri/src/error.rs"] pub mod error;
#[path = "../../cc-switch-runtime/src-tauri/src/config.rs"] pub mod config;
#[path = "../../cc-switch-runtime/src-tauri/src/settings.rs"] pub mod settings;
#[path = "../../cc-switch-runtime/src-tauri/src/app_config.rs"] pub mod app_config;
#[path = "../../cc-switch-runtime/src-tauri/src/codex_config.rs"] pub mod codex_config;
#[path = "../../cc-switch-runtime/src-tauri/src/model_capabilities.rs"] pub mod model_capabilities;
#[path = "../../cc-switch-runtime/src-tauri/src/provider.rs"] pub mod provider;
#[path = "../../cc-switch-runtime/src-tauri/src/database/mod.rs"] pub mod database;
#[path = "../../cc-switch-runtime/src-tauri/src/claude_desktop_config.rs"] pub mod claude_desktop_config;
#[path = "../../cc-switch-runtime/src-tauri/src/gemini_config.rs"] pub mod gemini_config;
#[path = "../../cc-switch-runtime/src-tauri/src/grok_config.rs"] pub mod grok_config;
#[path = "../../cc-switch-runtime/src-tauri/src/mcode_config.rs"] pub mod mcode_config;
#[path = "../../cc-switch-runtime/src-tauri/src/opencode_config.rs"] pub mod opencode_config;
#[path = "../../cc-switch-runtime/src-tauri/src/openclaw_config.rs"] pub mod openclaw_config;
#[path = "../../cc-switch-runtime/src-tauri/src/pi_config/mod.rs"] pub mod pi_config;
#[path = "../../cc-switch-runtime/src-tauri/src/hermes_config.rs"] pub mod hermes_config;
#[path = "../../cc-switch-runtime/src-tauri/src/prompt.rs"] pub mod prompt;
#[path = "../../cc-switch-runtime/src-tauri/src/prompt_files.rs"] pub mod prompt_files;
#[path = "../../cc-switch-runtime/src-tauri/src/usage_events.rs"] pub mod usage_events;
#[path = "../../cc-switch-runtime/src-tauri/src/usage_script.rs"] pub mod usage_script;
#[path = "../../cc-switch-runtime/src-tauri/src/mcp/mod.rs"] pub mod mcp;
#[path = "../../cc-switch-runtime/src-tauri/src/session_manager/mod.rs"] pub mod session_manager;
#[path = "../../cc-switch-runtime/src-tauri/src/claude_mcp.rs"] pub mod claude_mcp;
#[path = "../../cc-switch-runtime/src-tauri/src/gemini_mcp.rs"] pub mod gemini_mcp;
#[path = "../../cc-switch-runtime/src-tauri/src/codex_state_db.rs"] pub mod codex_state_db;

pub mod app_store { pub fn get_app_config_dir_override() -> Option<std::path::PathBuf> { std::env::var_os("SUBSCRIPTION_LENS_ROUTER_DATA").map(std::path::PathBuf::from) } }
pub mod tray { pub const TRAY_ID: &str = "subscription-lens-router"; pub fn create_tray_menu(_: &tauri::AppHandle, _: &crate::store::AppState) -> Result<(), String> { Ok(()) } }

#[path = "../../cc-switch-runtime/src-tauri/src/services/mod.rs"] pub mod services;

pub mod commands {
    use std::sync::Arc;
    use tokio::sync::RwLock;
    pub struct CodexOAuthState(pub Arc<crate::proxy::providers::codex_oauth_auth::CodexOAuthManager>);
    pub struct CopilotAuthState(pub Arc<RwLock<crate::proxy::providers::copilot_auth::CopilotAuthManager>>);
    pub struct XaiOAuthState(pub Arc<RwLock<crate::proxy::providers::xai_oauth_auth::XaiOAuthManager>>);
}

pub fn redact_known_secrets_strict(text: &str, secrets: &[String]) -> String { secrets.iter().filter(|secret| !secret.is_empty()).fold(text.to_string(), |value, secret| value.replace(secret, "[REDACTED]")) }
pub fn redact_url_for_log(url: &str) -> String { url.split(['?', '#']).next().unwrap_or(url).to_string() }
pub fn redact_url_origin_for_log(url: &str) -> String { url::Url::parse(url).ok().map(|parsed| format!("{}://{}", parsed.scheme(), parsed.authority())).unwrap_or_else(|| "[invalid target]".into()) }
pub fn redact_url_for_log_with_secrets(url: &str, secrets: &[String]) -> String { redact_known_secrets_strict(&redact_url_for_log(url), secrets) }
pub fn url_for_log_with_secrets(url: &str, secrets: &[String]) -> String { redact_url_for_log_with_secrets(url, secrets) }

pub mod store {
    use std::sync::Arc;
    use crate::{database::Database, proxy::providers::codex_oauth_auth::CodexOAuthManager, services::{ProxyService, UsageCache}};
    #[derive(Clone)] pub struct AppState { pub db: Arc<Database>, pub proxy_service: ProxyService, pub usage_cache: Arc<UsageCache>, pub codex_oauth_manager: Arc<CodexOAuthManager> }
    impl AppState { pub fn new(db: Arc<Database>) -> Self { let codex_oauth_manager = Arc::new(CodexOAuthManager::new(crate::config::get_app_config_dir())); let proxy_service = ProxyService::new_with_codex_oauth_manager(db.clone(), codex_oauth_manager.clone()); Self { db, proxy_service, usage_cache: Arc::new(UsageCache::new()), codex_oauth_manager } } }
}

#[path = "../../cc-switch-runtime/src-tauri/src/proxy/mod.rs"] pub mod proxy;
