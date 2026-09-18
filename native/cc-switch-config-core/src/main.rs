//! Minimal NDJSON host for the headless CC Switch configuration core.

use cc_switch_config_core::{apply_codex_route, CodexRoute};
use serde::Deserialize;
use serde_json::json;
use std::io::{self, BufRead, Write};

#[derive(Deserialize)]
#[serde(tag = "command", rename_all = "camelCase")]
enum Command {
    Status,
    ApplyCodexRoute {
        #[serde(rename = "baseUrl")]
        base_url: String,
        #[serde(rename = "apiKey")]
        api_key: String,
        model: String,
        #[serde(default)]
        models: Vec<String>,
    },
}

fn main() {
    let stdin = io::stdin();
    let mut stdout = io::stdout();
    for line in stdin.lock().lines() {
        let reply = match line
            .ok()
            .and_then(|line| serde_json::from_str::<Command>(&line).ok())
        {
            Some(Command::Status) => json!({ "ok": true, "value": { "runtime": "cc-switch-config-core" } }),
            Some(Command::ApplyCodexRoute { base_url, api_key, model, models }) => match apply_codex_route(&CodexRoute { base_url, api_key, model, models }) {
                Ok(()) => json!({ "ok": true, "value": {} }),
                Err(error) => json!({ "ok": false, "error": error.to_string() }),
            },
            None => json!({ "ok": false, "error": "Invalid route command." }),
        };
        if writeln!(stdout, "{reply}").is_err() || stdout.flush().is_err() {
            break;
        }
    }
}
