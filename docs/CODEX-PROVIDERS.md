# Codex provider routing

Subscription Lens can manage the providers used by Codex CLI and Codex GUI. The Codex task window remains the place where prompts are entered and responses are shown; Subscription Lens only changes the route and records local usage.

## Quick setup

1. Open **Routing** and choose **Import current Codex config**. This recognizes the official Codex login session without asking for an API key.
2. For another provider, choose a template (DeepSeek, Qwen, Moonshot/Kimi, GLM/Zhipu, MiniMax, SiliconFlow, Volcengine/Doubao, OpenRouter, Together AI, Groq, Mistral or Google Gemini). The endpoint, default model and environment variable are filled in automatically.
3. Enter the API key in **Advanced settings**. Subscription Lens encrypts it with Windows secure storage. The environment-variable field remains available for users who manage keys outside the app.
4. Choose **Save and test** to validate the profile. App-managed keys automatically use the local route so Codex never needs the key in its own configuration.
5. Use **Start local proxy** when you need a stable local endpoint or request logging. Choose **Connect proxy** once to point Codex to `127.0.0.1`; this first connection requires one Codex restart. After that, **Switch instantly** changes the upstream in memory without restarting the Codex GUI or CLI.

API keys are encrypted with the Windows secure-storage facility and are never returned to the renderer or written as plain text. Provider profiles contain only provider metadata and an environment-variable name; encrypted key blobs are kept separately. The local proxy listens on loopback and currently forwards Responses API requests; Chat Completions-only providers need a compatibility adapter before they can be enabled for Codex.

## Safety

The active `config.toml` is backed up before every switch. Writes use a temporary file followed by an atomic rename. The official OpenAI provider maps to Codex's built-in `openai` provider and does not replace `auth.json`.

## English / Nederlands

The same flow is available in the app's English and Dutch translations. Provider names, model IDs and endpoints are kept exactly as supplied by the user.
