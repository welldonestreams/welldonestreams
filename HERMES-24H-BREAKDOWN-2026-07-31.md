# Hermes 24-Hour Work Breakdown — 2026-07-31

**For Claude QC.** Everything Hermes did in the last ~24h across surfaces (desktop app → same gateway, Signal, Telegram). Agent runs as a Docker container on TrueNAS SCALE 25.10.4 (10.0.0.162), profile `default`, model deepseek-v4-flash. Canonical context: `WELL-DONE-HOMELAB.md`. **No secrets, credentials, or phone numbers in this file** — query live state directly if you need details. This is a point-in-time report; verify live before trusting.

---

## 1. Baseline onboarding — desktop session (~02:49–05:31 UTC)

- Synthesized the homelab baseline from Claude/ChatGPT/DeepSeek rundowns + `WELL-DONE-HOMELAB.md` into Hermes memory and skills.
- **Corrected TV path:** `tv` → `series` (`tank/data/media/series`); handoff doc updated in place.
- Deep-scanned the NAS (pools, disks incl. serials, dataset usage, ARC) and the Windows PC (CPU/GPU/drives/Tailscale nodes) via TrueNAS API + SSH-to-PC; saved compact facts to memory.
- Recovered from a stream-stall on a large `write_file` by switching to small memory entries (lesson: keep tool payloads < ~8K tokens).
- **Shut down the PC** at session end. The PC is currently OFF. Note: WOL from the Hermes container does NOT reach the LAN (container sits on a Docker bridge; broadcast doesn't cross) — WOL must originate on the LAN host.

## 2. Signal session (~05:12–05:44 UTC)

- NAS health check attempted over SSH → failed (host key + publickey). Root cause later fixed (see §3f SSH item).
- Telegram bot token stored in `.env`, gateway restarted, **Telegram connected as backup/parallel channel** alongside Signal.
- Memory consolidated (dropped a stale app-scan entry; refreshed Signal entry).

## 3. Telegram session (~05:46 UTC → now) — main work

### a) DeepSeek balance check
- `GET https://api.deepseek.com/user/balance` with `DEEPSEEK_API_KEY` → remaining balance only (`balance_infos[0].total_balance`); the API exposes **no usage breakdown**.

### b) Homepage DeepSeek balance widget
- Added `HOMEPAGE_VAR_DEEPSEEK_KEY` to the Homepage app env via TrueNAS **websocket `app.update`** (values sourced from `POST /app/config` with body `"homepage"` — plain JSON string).
- `services.yaml`: Hermes entry switched from `widget:` to a **`widgets:` list**; second customapi widget → `https://api.deepseek.com/user/balance`, header `Authorization: Bearer {{HOMEPAGE_VAR_DEEPSEEK_KEY}}`, mapping `balance_infos.0.total_balance` (shvl dot-path incl. array index), `format: currency`.
- Uploaded via `filesystem/put` (multipart `data` + `file` parts). Verified via `GET /api/services/proxy?service=Hermes&group=AI&index=1` → live balance JSON. Env-var convention keeps the key out of the YAML.

### c) Seerr widget 403 fix
- **Root cause:** `HOMEPAGE_VAR_SEERR_KEY` was stored **base64-encoded**; Overseerr requires the raw key → 403 on `/api/v1/request/count` (both public and local endpoints).
- Fix: base64-decode (88 chars → 64 chars), pushed via `app.update` (redeploy), verified HTTP 200 with live request counts. Pre-existing bug, not caused by (b).

### d) Notification quieting (user request)
- `display.interim_assistant_messages: false` (this was emitting mid-task messages to Telegram).
- `display.platforms.telegram/signal: tool_progress: off`.
- Gateway restarted to apply. User preference: one final "Done" message, no interim spam.

### e) Emergency kill-switch ("nuke") — new capability
- `/opt/data/nuke_check.py` — phrase matcher. Case-insensitive exact match → STANDARD; phrase + literal all-caps `FULL` suffix → FULL. Constant-time compare, never prints the phrase. **11/11 tests pass.**
- `/opt/data/nuke.py` — executor, `--dry-run` default, `--yes` to execute:
  - **standard:** delete every app except `immich`; destroy `tank/data`, `tank/backups`, and all `tank/apps/*` datasets except immich's. Keeps pools, TrueNAS OS, `tank/photos`, Immich.
  - **full:** additionally delete the immich app, destroy `tank/photos` + `tank/apps/immich`; PC additionally `clean all` non-system disks.
  - PC wipe via SSH (user profile + format non-system volumes); WOL attempted if off.
  - 30s abort grace polling `/opt/data/.nuke_abort`; logs to `/opt/data/logs/nuke-*.log`.
  - Execution order: apps (except hermes) → datasets → hermes-agent last.
- **Bug caught in dry-run review:** the original dataset plan included `tank/apps` root as a destroy target — that would have wiped Immich's config even in standard mode. Hard guards added: `tank` / `tank/apps` never targeted; `tank/photos` only in full. Both levels dry-run verified.
- Trigger protocol (documented in `nuke-runbook` skill): phrase → arm → re-confirm within 60s → execute (30s grace). `ABORT` cancels. Phrase file `/opt/data/.nuke_phrase` (0600). User chose to keep the transcript copy.

### f) Loose-ends sweep (items from the dreaming brief)
- **SSH to NAS:** appended `hermes_pc.pub` to `truenas_admin` `~/.ssh/authorized_keys` (chown 950:950, chmod 600) via API `filesystem/put` + `chown` + `setperm` → **verified `SSH_OK` as `truenas_admin`**. Direct shell access now works from the container.
- **Homepage layout:** applied the remaining `update-homepage.sh` changes manually (script is zsh+sudo, not runnable from container): Switch + Access Point moved out of Infrastructure into new **Homelab Accounts** group (using the HTTPS proxy names per the "no raw IPs" rule); **Real-Debrid** added to Indexers. Bookmarks changes were already applied. Live-verified via `/api/services`. Note: `update-homepage.sh` is now stale/redundant for services.yaml.
- **Kuma Signal prep:** `signal-api-kuma` dataset exists; ACL corrected to USER 950 + GROUP 568 (full control, file+dir inherit). **Pitfall:** `filesystem.setacl` perms/flags are individual boolean fields, not `BASIC: FULL_CONTROL` / `INHERIT: "..."` strings — that payload form returns EINVAL.
- **Kuma notification verified intact** (read-only query of `kuma.db`): signalURL `http://10.0.0.162:9922/v2/send`, recipients = user's number. The rest-api container on 9922 is currently **gone** → alerts dead until redeployed (user action pending, see §5).
- **Vision 401 root-caused:** dead `OPENAI_API_KEY` (401 on api.openai.com). Checked NAS Ollama (port 30068) — no vision models. PC offline. **New OpenAI key installed, verified 200** — fixes `vision_analyze` AND the `gpt-5.4-nano` fallback provider.
- **Telegram api_id/api_hash rotated:** new values stored in `.env` (`TELEGRAM_API_ID`, `TELEGRAM_API_HASH`); the old scripts that contained them were already deleted. Gateway restarted.

### g) Skills / references written
- `homelab-operations/references/truenas-api-file-edits.md` — verified API paths: REST `/filesystem/get` returns **empty body** on 25.10 (unusable); use `core/download` (body key is `args`, NOT `arguments`); writes via `filesystem/put` multipart; app config read `POST /app/config '"name"'` + mutate + websocket `app.update`; `core.get_methods` needs `max_size=100_000_000`; seerr base64 pitfall; homepage proxy verification endpoints.
- `nuke-runbook` skill — trigger protocol, levels, safety invariants, execution order.

## 4. Dreaming cron (11:00 UTC — daily `0 11 * * *`)

- Ran `last_status: ok` in 12 min: read all 3 sessions of the last 24h (desktop 785 msgs, Signal 130, Telegram ~250), wrote `/opt/data/second-brain/homelab/daily-brief.md` (17.5 KB, mode 600, secret-scanned clean), stored 11 durable facts to Mnemosyne, removed a stray extraction file a subagent left in this repo (git tree clean again).

## 5. Current state / open items

- **Gateway restarted ~07:05 UTC** with new OpenAI key + Telegram credentials → verify Telegram reconnect, `vision_analyze`, fallback provider.
- **Kuma Signal alerts: PENDING USER** — deploy `bbernhard/signal-cli-rest-api` on port 9922 with mount `/mnt/tank/apps/signal-api-kuma` → `/home/.local/share/signal-cli`, then link the device via `/v1/qrcode?number=…` (QR scan in Signal). Hermes cannot deploy apps (no docker access); user does WebUI.
- PC is OFF (shut down intentionally). WOL-from-container ineffective (bridge network).
- Carried open items (unchanged): UPS NUT unconfigured; no off-box backup; apps pool single-NVMe; OPNsense 26.7 deferred; Bazarr providers thin.
- Pre-existing risk surfaced: `kuma.db` notification config contains a live Resend API key (pre-existing, untouched).

## 6. Suggested QC checks for Claude

1. `GET /api/services` + `/api/services/proxy?service=Hermes&group=AI&index=1` (DeepSeek balance) and `…service=Seerr&group=Media&index=0&endpoint=request/count` — both should return live data.
2. `yaml.safe_load` of `/mnt/tank/apps/homepage/services.yaml` (via TrueNAS API `core/download`) — must parse; Hermes entry has 2 widgets.
3. `filesystem.getacl` on `/mnt/tank/apps/signal-api-kuma` → expect `USER 950 ALLOW` + `GROUP 568 ALLOW`.
4. `/opt/data/nuke.py --dry-run` (and `--level full --dry-run`) — plan only; do NOT run `--yes`.
5. Gateway log (`/opt/data/logs/agent.log`) post-restart: telegram + signal connected.
6. `authorized_keys` for `truenas_admin` now has 2 keys (Windows PC + hermes).
7. Trivia: `core/download` returns `[job_id, url]`; poll jobs via `GET /core/get_jobs?id=N`.
