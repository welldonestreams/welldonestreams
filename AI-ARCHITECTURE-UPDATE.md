# Hermes AI Architecture — Updated 2026-08-01 05:00 UTC

## What changed since the 2026-07-29 snapshot

### Memory & Knowledge
- **Mnemosyne MCP**: 36-tool memory system active on TrueNAS. Semantic search across all conversations.
- **Obsidian vault**: `/opt/data/second-brain/` on NAS, 8 categories (homelab, finance, health, work, personal, projects, incidents, runbooks).
- **Dreaming cron**: 4 AM PDT daily — summarizes sessions → Mnemosyne + vault.
- **Memory limits**: bumped to 5000 chars (was 2200). Built-in memory + Mnemosyne + vault = three-tier memory architecture.

### Messaging
- **Signal**: Native signal-cli daemon (0.14.6, Java 25) → Hermes gateway. Linked device "HermesAgent" on user's phone. Separate container `signal-cli-daemon` on `ix-hermes-agent_default` network.
- **Telegram**: @welldonestreams_hermes_bot connected to gateway. Both Signal + Telegram active simultaneously.
- **Kuma alerts**: Restored — separate signal-api container (json-rpc) on port 9922 with independent data dir `/mnt/tank/apps/signal-api-kuma`. Device "kuma-alerts" linked.

### Backup (was #1 risk — now resolved)
- **Restic → Backblaze B2**: Daily 2 AM backup + weekly forget/prune (7d/4w/6m). Backs up `/mnt/tank/apps` + `/mnt/tank/photos` (~28GB). Media excluded (10.7TB — re-acquirable). Cost: ~$0.17/month.
- **Secrets pattern**: B2 keys in `/root/.b2-env` (chmod 600), sourced at runtime. Never inline in cron commands.
- **First backup**: Currently running. Restore test pending.

### TrueNAS API Access
- Hermes has full TrueNAS API key with pool/app/dataset/filesystem access.
- SSH from Hermes container → TrueNAS host active (`truenas_admin@10.0.0.162`).

### PC Control
- SSH from Hermes → Windows PC via Tailscale (chanc@100.127.203.86).
- Wake-on-LAN: `python3 /opt/data/wol.py 10:FF:E0:65:48:89`.
- PowerShell remote execution works.

### Model Routing
- Default: DeepSeek V4-Flash
- Fallback chain: DeepSeek V4-Pro → OpenAI GPT-5.4 Nano
- Auxiliary tasks (compression, titles, web) routed to Flash
- Vision routed to OpenAI Nano (Flash has no vision)
- Claude Code through DeepSeek unchanged
- `local` alias → Windows Ollama gpt-oss-hermes unchanged

### Homepage (pending)
- Hermes + Telegram entries ready to add
- Chat widget script prepared
- Dark mode active

### Operating Principles (from session failures)
1. Verify, don't report — exit code ≠ success. Test the effect.
2. Secrets never in command strings or git — chmod 600 env file pattern.
3. Memory vs live state: live wins, fix memory in place.
4. Restore-test pattern generalizes to every setup.

### Services Status
- 25 apps RUNNING, Kometa STOPPED
- Native signal-cli daemon: healthy
- Kuma signal-api: healthy
- pools: tank ONLINE (21%), apps ONLINE (10%)
- All 6 HDDs + 2 NVMe: healthy

## Next Priority
1. Rotate Sonarr/Radarr API keys (exposed in ChatGPT export)
2. UPS + NUT graceful shutdown (free, owned hardware)
3. apps pool NVMe mirror (hardware buy)
4. Homepage: add Hermes/Telegram/chat widget
