# Hermes, Ollama, and DeepSeek architecture

Last verified: 2026-07-29 (America/Los_Angeles)

This is the sanitized cross-agent explanation of the AI setup. It omits
credentials, private Tailscale addresses, and the private topology embedded in
the local model.

**Routing was revised after this snapshot.** `HERMES-CONFIG-DECISIONS.md`
(2026-07-31) supersedes the "Canonical Hermes configuration" section below: it
records an automatic fallback chain (Flash → Pro → a small OpenAI model) and a
manual frontier alias, neither of which existed on 2026-07-29. Treat that file
as authoritative for model routing and this file as authoritative for the
deployment, local-model, and recovery procedure.

## Result

There is one canonical Hermes backend on TrueNAS and one native Windows
fallback. Windows Hermes Desktop normally connects to TrueNAS, so desktop and
web show the same sessions and built-in memory. The native Windows backend is
independent and is used only if TrueNAS is unavailable.

Inference paths:

1. **General work:** DeepSeek V4 Flash is the canonical Hermes default.
2. **Coding:** Claude Code uses DeepSeek's Anthropic-compatible API with V4 Pro
   for the main agent and V4 Flash for subagents.
3. **Private homelab work:** Hermes alias `local` uses a knowledge-enhanced
   `gpt-oss-hermes` served by Windows Ollama over Tailscale.

This is not fine-tuning. The homelab map is a private local knowledge document
embedded in the local Ollama derivative's system context. This is cheaper,
reversible, easy to update, and avoids training on volatile configuration.

## Component map

| Component | Location | Role |
| --- | --- | --- |
| Hermes Agent 0.19.0 | TrueNAS app, port `30433` | Canonical sessions, memory, skills, routing, and dashboard. |
| Hermes Desktop | Windows | Authenticated connection to the TrueNAS gateway. |
| Hermes native backend | Windows | Independent offline fallback; not synchronized. |
| Ollama | Windows | Private local inference/embeddings, reachable from TrueNAS only over Tailscale. |
| `gpt-oss-hermes` | Windows Ollama | 64K tool-capable homelab model with private operating context. |
| `deepseek-r1-hermes` | Windows Ollama | Optional slow reasoning model; not default after tool validation failed. |
| `nomic-embed-text` | Windows Ollama | 768-dimensional local embeddings for future semantic memory. |
| DeepSeek V4 Flash | DeepSeek API | General Hermes and auxiliary-task model. |
| DeepSeek V4 Pro | DeepSeek API through Claude Code | Main coding model. |
| OpenAI Codex OAuth | Manual Hermes `cloud` alias | Explicit alternative, not default. |

Ollama was not duplicated on TrueNAS. The NAS had only about 3 GiB free RAM
during review, while Windows has the RX 7800 XT needed for useful inference.

## Canonical Hermes configuration

- Dashboard/gateway: `http://truenas.welldonestreams.com:30433`.
- Dashboard uses basic authentication; the rotated password is in the user's
  password manager, never Git or handoff files.
- Public webhook binding: disabled.
- Active profile: `default`.
- Main model: `deepseek-v4-flash`, provider `deepseek`.
- Auxiliary model: `auto`, which resolves to the main model.
- Manual `local` alias: private Ollama-compatible endpoint, model
  `gpt-oss-hermes`.
- Manual `cloud` alias: existing OpenAI Codex OAuth path.
- Custom skills on both backends: `safe-homelab-operator` and
  `deepseek-claude-code`.

The DeepSeek key exists only in Hermes's secret store. It is not in YAML, a
prompt, a repository, or this document.

## Windows configuration

### Hermes and Ollama

- Hermes Desktop and Ollama start at Windows login.
- Desktop's default remote connection is the authenticated TrueNAS gateway.
- Ollama exposes loopback plus private Tailscale only; no public listener or
  LAN firewall exception exists.
- Ollama unloads idle models so VRAM is released before gaming.
- Models: `gpt-oss:20b`, `gpt-oss-hermes`, `deepseek-r1:14b`,
  `deepseek-r1-hermes`, and `nomic-embed-text`.

Private source and model recipe, both outside Git:

```text
%LOCALAPPDATA%\hermes\knowledge\WELL-DONE-HOMELAB.md
%LOCALAPPDATA%\hermes\knowledge\Modelfile.welldone-homelab
```

After a durable topology/config change, update both private files and rebuild
without changing the model name:

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" create gpt-oss-hermes `
  -f "$env:LOCALAPPDATA\hermes\knowledge\Modelfile.welldone-homelab"
```

Both Hermes installations then receive the updated knowledge through `local`
without endpoint changes.

### Claude Code through DeepSeek

```text
Claude Code:
  %USERPROFILE%\.local\bin\claude.exe

Credential setter:
  %LOCALAPPDATA%\hermes\skills\autonomous-ai-agents\deepseek-claude-code\scripts\set-deepseek-key.ps1

Repository-restricted launcher:
  %LOCALAPPDATA%\hermes\skills\autonomous-ai-agents\deepseek-claude-code\scripts\invoke-claude-deepseek.ps1
```

The setter validates a masked `sk-...` entry and stores it with user-bound
Windows DPAPI. The launcher requires an explicit Git repository, loads the key
only into the child process, and clears it afterward. Effective variables:

```text
ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
ANTHROPIC_AUTH_TOKEN=<loaded only at runtime>
ANTHROPIC_MODEL=deepseek-v4-pro[1m]
ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-v4-pro[1m]
ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-v4-pro[1m]
ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-v4-flash
CLAUDE_CODE_SUBAGENT_MODEL=deepseek-v4-flash
CLAUDE_CODE_EFFORT_LEVEL=max
```

## Rules for other agents

- Select `local` before asking about internal IPs, ports, paths, firewall
  state, proxy mappings, or recovery procedures.
- Never paste the private knowledge file into DeepSeek, Claude, OpenAI, or any
  other cloud prompt.
- Keep Flash as everyday default; use Pro only through the restricted Claude
  Code launcher for programming.
- Start homelab work read-only. Require confirmation before deletion, public
  exposure, firewall/DNS changes, upgrades, credential rotation, or reducing
  security/recoverability.
- Query exact fields. Never dump admin configs, container environments, SSH
  configs, or encrypted-dataset properties.
- After a verified durable change: update private context, rebuild the local
  model, then update sanitized public handoff/docs separately.

## Validation

- TrueNAS Hermes V4 Flash returned the expected smoke marker through the
  official DeepSeek endpoint.
- Windows Claude Code V4 Pro returned the expected coding marker.
- TrueNAS Hermes completed a full turn against Windows Ollama over Tailscale.
- `gpt-oss-hermes` stayed GPU-resident on the RX 7800 XT and made a valid
  structured tool call at roughly 94 tokens/second in the direct test.
- `deepseek-r1:14b` was slower and failed the structured-tool test, so it is
  optional only.
- Both custom skills passed validation on TrueNAS and Windows.

## Availability and failure modes

- If Windows, Ollama, or Tailscale is off, `local` is unavailable; DeepSeek
  Flash and the manual cloud alias remain usable.
- If TrueNAS is down, Windows can use its native backend, but fallback sessions
  do not automatically synchronize back.
- Embedded operating context can become stale. Verify live state before a
  mutation and rebuild after durable changes.
- The model context is not a credential vault; never put secrets in it.
