//! Subscription Lens' embedded, headless CC Switch host.
//!
//! The JSON-lines control channel is private to Electron. All request
//! forwarding, Codex takeover, recovery and hot switching are CC Switch
//! runtime services compiled from the pinned upstream source.

use cc_switch_router_core::{
    app_config::AppType,
    database::Database,
    provider::Provider,
    settings,
    services::ProviderService,
    store::AppState,
};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

const ROUTE_PREFIX: &str = "subscription-lens-";
const SAFE_FALLBACK_MODEL: &str = "gpt-5.6-sol";
const CODEX_COMPATIBLE_ALIASES: [&str; 5] = ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna", "gpt-6-astra", "gpt-5.5"];

#[derive(Deserialize, Serialize, Clone)]
struct ModelMapping {
    alias: String,
    upstream: String,
}

#[derive(Deserialize)]
#[serde(tag = "command", rename_all = "camelCase")]
enum Command {
    Status,
    ActivateCodexProvider {
        #[serde(rename = "providerId")]
        provider_id: String,
        name: String,
        #[serde(rename = "baseUrl")]
        base_url: String,
        #[serde(rename = "apiKey")]
        api_key: String,
        #[serde(rename = "upstreamModel")]
        upstream_model: String,
        #[serde(rename = "modelMappings", default)]
        model_mappings: Vec<ModelMapping>,
        #[serde(default)]
        protocol: Option<String>,
    },
    SwitchCodexProvider { #[serde(rename = "providerId")] provider_id: String },
    ActivateCodexOfficial,
    StopAndRestore,
    Shutdown,
}

#[derive(Serialize)]
struct Reply {
    ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    value: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

fn ok(value: Value) -> Reply { Reply { ok: true, value: Some(value), error: None } }
fn fail(error: impl ToString) -> Reply { Reply { ok: false, value: None, error: Some(error.to_string()) } }

fn safe_id(raw: &str) -> Result<String, String> {
    let id = raw.trim();
    if id.is_empty() || id.len() > 80 || !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        return Err("Invalid provider identifier".to_string());
    }
    Ok(format!("{ROUTE_PREFIX}{id}"))
}

fn quoted_toml(raw: &str) -> String { serde_json::to_string(raw).unwrap_or_else(|_| "\"\"".to_string()) }

fn build_provider(
    provider_id: String, name: String, base_url: String, api_key: String,
    upstream_model: String, model_mappings: Vec<ModelMapping>, protocol: Option<String>,
) -> Result<Provider, String> {
    let base_url = base_url.trim().trim_end_matches('/').to_string();
    let upstream_model = upstream_model.trim().to_string();
    if !base_url.starts_with("https://") || upstream_model.is_empty() || api_key.trim().is_empty() {
        return Err("Provider endpoint, model and API key are required".to_string());
    }
    let mappings = if model_mappings.is_empty() {
        vec![ModelMapping { alias: SAFE_FALLBACK_MODEL.to_string(), upstream: upstream_model.clone() }]
    } else { model_mappings };
    let mut aliases = std::collections::HashSet::new();
    for mapping in &mappings {
        if !CODEX_COMPATIBLE_ALIASES.contains(&mapping.alias.trim()) || !aliases.insert(mapping.alias.trim().to_string()) || mapping.upstream.trim().is_empty() || mapping.upstream.chars().any(char::is_control) {
            return Err("Invalid or duplicate Codex model mapping".to_string());
        }
    }
    let primary_alias = mappings.first().map(|mapping| mapping.alias.trim()).unwrap_or(SAFE_FALLBACK_MODEL);
    let wire_api = if protocol.as_deref() == Some("chat") { "chat" } else { "responses" };
    // Keep a ChatGPT-compatible model in live config. The upstream model is
    // retained only in the provider record and the CC Switch proxy substitutes
    // it while forwarding. Existing ChatGPT-authenticated chats therefore do
    // not have to select an unsupported third-party slug.
    let config = format!(
        "model_provider = {}\nmodel = {}\n\n[model_providers.{}]\nname = {}\nbase_url = {}\nwire_api = {}\nrequires_openai_auth = false\n",
        quoted_toml(&provider_id), quoted_toml(primary_alias), provider_id,
        quoted_toml(&name), quoted_toml(&base_url), quoted_toml(wire_api),
    );
    Ok(Provider::with_id(
        provider_id, name, json!({
            "auth": { "OPENAI_API_KEY": api_key.trim() },
            "config": config,
            "model": upstream_model,
            // Keep the desktop client's picker on model ids valid for a
            // ChatGPT-authenticated Codex session. The CC Switch proxy maps
            // each stable alias to its configured upstream model before
            // forwarding. Publishing third-party slugs here makes existing
            // chats fail client-side before the proxy can run.
            "codexAliasMappings": mappings.clone(),
            "modelCatalog": {
                "models": mappings.iter().map(|mapping| json!({ "model": mapping.alias.trim() })).collect::<Vec<_>>()
            },
        }), Some(base_url),
    ))
}

async fn activate(state: &AppState, provider: Provider) -> Result<Value, String> {
    let id = provider.id.clone();
    state.db.save_provider("codex", &provider).map_err(|error| error.to_string())?;
    // Use the upstream normal switch to create its provider-owned snapshot;
    // then hand ownership to the upstream transactional takeover flow.
    ProviderService::switch(state, AppType::Codex, &id).map_err(|error| error.to_string())?;
    state.proxy_service.set_takeover_for_app("codex", true).await?;
    let status = state.proxy_service.get_status().await?;
    Ok(json!({ "providerId": id, "takeover": true, "status": status }))
}

async fn activate_official(state: &AppState) -> Result<Value, String> {
    // Follow CC Switch's own provider transition semantics: switch the active
    // target to its built-in official seed while takeover is still active so
    // the backup is rebuilt from the official provider, then release takeover.
    state
        .db
        .ensure_official_seed_by_id("codex-official", AppType::Codex)
        .map_err(|error| error.to_string())?;
    ProviderService::switch(state, AppType::Codex, "codex-official")
        .map_err(|error| error.to_string())?;
    state.proxy_service.set_takeover_for_app("codex", false).await?;
    Ok(json!({ "providerId": "codex-official", "takeover": false }))
}

#[tokio::main]
async fn main() {
    // Keep Codex's native ChatGPT login while a third-party route is active.
    // Upstream CC Switch defaults this compatibility flag to false, which
    // deletes auth.json during the normal switch that precedes takeover and
    // forces an unnecessary browser login when returning to OpenAI Official.
    let mut router_settings = settings::get_settings();
    if !router_settings.preserve_codex_official_auth_on_switch {
        router_settings.preserve_codex_official_auth_on_switch = true;
        if let Err(error) = settings::update_settings(router_settings) {
            println!("{}", serde_json::to_string(&fail(error)).unwrap());
            return;
        }
    }
    let database = match Database::init() {
        Ok(database) => Arc::new(database),
        Err(error) => { println!("{}", serde_json::to_string(&fail(error)).unwrap()); return; }
    };
    let state = AppState::new(database);
    let mut lines = BufReader::new(tokio::io::stdin()).lines();
    let mut stdout = tokio::io::stdout();

    while let Ok(Some(line)) = lines.next_line().await {
        let shutdown = matches!(serde_json::from_str::<Command>(&line), Ok(Command::Shutdown));
        let response = match serde_json::from_str::<Command>(&line) {
            Ok(Command::Status) => state.proxy_service.get_status().await.map(|status| ok(json!(status))).unwrap_or_else(fail),
            Ok(Command::ActivateCodexProvider { provider_id, name, base_url, api_key, upstream_model, model_mappings, protocol }) => {
                match safe_id(&provider_id).and_then(|id| build_provider(id, name, base_url, api_key, upstream_model, model_mappings, protocol)) {
                    Ok(provider) => activate(&state, provider).await.map(ok).unwrap_or_else(fail),
                    Err(error) => fail(error),
                }
            }
            Ok(Command::SwitchCodexProvider { provider_id }) => {
                safe_id(&provider_id)
                    .and_then(|id| ProviderService::switch(&state, AppType::Codex, &id).map_err(|error| error.to_string()))
                    .map(|result| ok(json!(result))).unwrap_or_else(fail)
            }
            Ok(Command::ActivateCodexOfficial) => activate_official(&state).await.map(ok).unwrap_or_else(fail),
            Ok(Command::StopAndRestore) => state.proxy_service.stop_with_restore().await.map(|_| ok(json!({ "restored": true }))).unwrap_or_else(fail),
            Ok(Command::Shutdown) => { let _ = state.proxy_service.stop_with_restore().await; ok(json!({ "stopped": true })) }
            Err(error) => fail(format!("Invalid router command: {error}")),
        };
        let encoded = serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":false,\"error\":\"Router response encoding failed\"}".into());
        if stdout.write_all(encoded.as_bytes()).await.is_err() || stdout.write_all(b"\n").await.is_err() || stdout.flush().await.is_err() { break; }
        if shutdown { break; }
    }
}


