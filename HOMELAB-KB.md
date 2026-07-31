---
title: Homelab Knowledge Base
date: 2026-07-31
tags: [homelab, inventory, canonical]
status: current
supersedes: WELL-DONE-HOMELAB.md (reconciled 2026-07-29)
---

# Homelab Knowledge Base

Curated current-state inventory. Canonical detail lives in `WELL-DONE-HOMELAB.md` (private-homelab repo); this file is the vault-native snapshot. **Live state beats this file** — verify before acting on anything destructive.

## Operator
- Chance, A1C USAF, 1D7X1, 60CS/CMAC, Travis AFB. Home of record: Ogden, UT.
- Comms: direct, blunt, exact commands/specs, no hedging. Wants action, not questions — except destructive/irreversible ops.
- Rules: TrueNAS shell is **zsh** (no shebangs, one command at a time). Secrets in Vaultwarden/.env only, never in public repos or chat. Dry-run destructive ops first.

## Network (flat 10.0.0.0/24)
| Role | Address |
|---|---|
| Router/firewall | OPNsense on Sophos XG 210, 10.0.0.1:4444 (26.7 upgrade deferred) |
| Managed switch | TP-Link TL-SG2210P, 10.0.0.168 |
| AP | EAP650, 10.0.0.117, SSID CC+JUNI |
| DNS | AdGuard 10.0.0.162:53 → Unbound 10.0.0.1:5353. Domain: steak |
| Remote | WireGuard (vpn.welldonestreams.com) + Tailscale subnet router on TrueNAS |

## Primary host — TrueNAS SCALE 25.10.4 @ 10.0.0.162
- CWWK CW-NAS-ADLN-K, Intel N100 (4c), 16GB DDR5 (~3.4-3.9GB free). CPUFAN header dead → fan on SYSFAN1. ASM1166 SATA dead → all 6 HDDs via GLOTRENDS SA3026-C PCIe x4.
- **tank**: 1× RAIDZ2, 6× WD100EFGX 10TB, ~36 TiB usable, ~21% full, unencrypted. Movies 5.25T, series 1.87T, anime 277G, usenet 172G, photos 24G.
- **apps**: single KIOXIA 512GB NVMe stripe, NO redundancy (deliberate). Holds ix-apps Docker state + DBs.
- **Boot**: Samsung PM981a 256GB NVMe. ARC capped 8GB. Scrub Sundays 00:00.
- Dataset layout: `tank/data/media/{movies,series,anime}`, `tank/data/usenet/{incomplete,complete}`, `tank/photos` (Immich), `tank/apps` (per-app config datasets), `tank/backups`.
- **TV path is `series`, NOT `tv`** — `/mnt/tank/data/media/series`.
- ACL pattern: every dataset needs User-truenas_admin + Group-apps (GID 568), Full Control, File+Dir inherit. Verify with `nfs4xdr_getfacl`.
- Hermes container: `/opt/data` (HERMES_HOME), TrueNAS API key in `.env`, direct SSH as `truenas_admin` works (key `/opt/data/.ssh/hermes_pc`).

## App stack (all 10.0.0.162 unless noted)
Plex 32400 (HOST network, QuickSync) · Seerr 30357 PUBLIC · Sonarr 30113 · Radarr 30025 · Prowlarr 30050 · Bazarr 6767 · NZBGet 6789 · Tautulli 30047 · Immich 30041 · Paperless ~30070 · Homepage 30054 (config at dataset ROOT) · NPM 8080/4443/8181 · Vaultwarden 30032 (LAN/WG only) · Renewals 30600 PUBLIC+PIN · Uptime Kuma (LAN, alerts DEAD until rest-api redeploy — see open items) · Beszel 30333 · AdGuard 30004 · signal-api (native daemon, Hermes) · Ollama 30068 (no vision models) · Kometa STOPPED · Recyclarr cron 0 3 * * *.

## Media pipeline
Usenet only (NZBGet). Frugal single provider (newswest+bonus). Indexers: NZBGeek (paid, exp Jan 2027) + DrunkenSlug. Sonarr/Radarr Remote Path Mapping (10.0.0.162, /downloads/ → /data/usenet/). Strictly 1080p. NZBGet categories lowercase: `sonarr`, `radarr`, `Prowlarr`. Bazarr providers thin (OpenSubtitles ~20/day).

## Public-facing ("Well Done Streams")
ONLY Plex + Seerr + Renewals + landing. Wildcard *.welldonestreams.com LE cert via NPM (Cloudflare DNS-01, exp ~2026-10-23). Public repos: welldonestreams, welldonestreams-worker, finance — ALL PUBLIC, secrets never committed, phone-number pre-commit hook.

## Decision defaults
Minimal public exposure · self-host over subscriptions · snapshot before destructive ZFS ops · trust live state over docs · cross-agent sync via GitHub + Obsidian + Mnemosyne (Obsidian NOT yet linked to Claude as of 2026-07-31).

## Open items
1. **Kuma Signal alerts dead** — rest-api container on 9922 gone; fix staged (`tank/apps/signal-api-kuma` dataset ready, ACL correct). Repoint + deploy + QR-link device, then Kuma alerts return.
2. **No off-box backup** (top risk) → see [[RUNBOOK-BACKUP-STRATEGY]].
3. UPS NUT graceful shutdown unconfigured.
4. apps pool single-NVMe, no redundancy.
5. OPNsense 26.7 deferred.
6. Anime consolidation → see [[RUNBOOK-ANIME-CONSOLIDATION]].
7. Claude live vault access pending (plan-tier + surface decision).

## Related
- [[HERMES-CONFIG-DECISIONS]] · [[HERMES-COST-REPORT]] · [[RUNBOOK-ANIME-CONSOLIDATION]] · [[RUNBOOK-BACKUP-STRATEGY]]
