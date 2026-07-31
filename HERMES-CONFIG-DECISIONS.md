---
title: Hermes Configuration & Routing Decisions
date: 2026-07-31
tags: [hermes, decisions, routing, cost, security]
status: final
---

# Hermes Configuration & Routing Decisions

Decision history from the 2026-07-31 audit conversation (Claude-QC'd, evidence-verified). Only place this history exists — keep it.

## Final routing (settled 2026-07-31)
- **Automatic chain (unattended):** deepseek-v4-flash (primary) → deepseek-v4-pro → openai/gpt-5.4-nano. Cheap, self-healing, near-free with caching.
- **Frontier on demand:** `/model cloud` → gpt-5.6-sol via **openai-codex OAuth** (ChatGPT subscription, flat-rate — not metered). Invoked deliberately for the hard 10%.
- **Why no auto-escalation to frontier:** Codex OAuth is intentionally excluded from fallback chains — OpenAI gates that endpoint behind an undocumented, shifting model allow-list, so a hardcoded fallback entry silently rots (source: `agent/auxiliary_client.py`). Manual switch also means no autonomous loop can burn subscription capacity.
- **Anthropic: out.** OAuth subscription auth exists in Hermes v0.19.0 (`hermes auth add anthropic --type oauth`) but **requires Claude Max + purchased extra credits — "Claude Pro subscribers cannot use this path"** (official docs). Pro is API-key-only; Max defeats the cost goal. API-key-or-nothing → nothing.

## Safety architecture (2026-07-31)
- **Approvals deny gate** (`approvals.deny` in config.yaml, 8 fnmatch patterns): `pool.dataset.delete`, `pool/dataset/id`, `app.delete`, `app/id`, `filesystem.setacl`, `filesystem/setacl`, `disk.wipe`, `disk/wipe`. Blocks BEFORE the yolo/mode=off bypass — even an `echo` containing the pattern is blocked.
- **Why:** smart approval scans shell-command strings; curl/python API calls contain none of the rm -rf/zfs-destroy patterns → were auto-approved. The REST slash-form (`/api/v2.0/pool/dataset/id/...`) bypassed the dotted patterns; both forms now covered and live-tested.
- **Hard stop enabled:** `tool_loop_guardrails.hard_stop_enabled: true` (5 same-tool / 5 exact-failure / 5 no-progress).
- **Behavior gate (memory rule):** destructive-class TrueNAS API calls need explicit user yes; `app.update` asking if it touches storage/env/network, cosmetic edits autonomous. Nuke double-confirm = approval.
- **Nuke kill-switch:** `/opt/data/nuke.py` + `nuke_check.py` + `.nuke_phrase` (0600). Standard = wipe all but Immich; FULL (all-caps suffix) = wipe Immich too. Arm → re-confirm 60s → 30s grace → ABORT cancels. Dry-run verified both levels; `tank/apps` root bug caught pre-deploy.

## Token setup (audited, no changes needed)
- `agent.max_turns: 60`; compression ON (threshold 0.5, target 0.2, protect last 20).
- Auxiliary routing already on cheap path: compression/web_extract/title_generation/session_search → deepseek-v4-flash; vision → openai/gpt-5.4-nano.
- Prompt caching working: 96-100% hit on ~281K-token prefix; per-turn cost ≈ fraction of a cent.
- Tool output caps in place (read_file 2000 lines, terminal truncation, execute_code 50KB).

## Messaging (2026-07-31)
- `display.interim_assistant_messages: false`; `tool_progress: off` for telegram+signal → one "Done" message, no interim spam.
- `gateway_restart_notification: false` for telegram+signal → restarts are silent.
- Telegram is backup/parallel to Signal; Signal native daemon is primary (self-messaging mode).
- Telegram api_id/api_hash rotated 2026-07-31; OpenAI key replaced (was 401).

## Verified state (evidence, 2026-07-31)
- Live config: `/opt/data/config.yaml` (HERMES_HOME=/opt/data; no ~/.hermes/config.yaml exists — single source).
- Keys loaded: DEEPSEEK_API_KEY, OPENAI_API_KEY (valid), TRUENAS_API_KEY, GH_PAT, Telegram/Signal vars, openai-codex OAuth credential.
- Git hygiene: zero secret/PII matches in all 3 public repos (grep-verified).
- Mnemosyne: 11 facts, correct values (series not tv), stale SSH fact amended in place.

## Related
- [[HOMELAB-KB]] · [[HERMES-COST-REPORT]] · [[RUNBOOK-BACKUP-STRATEGY]]
