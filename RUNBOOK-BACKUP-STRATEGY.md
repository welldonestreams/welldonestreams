---
title: Runbook — Backup Strategy & Off-Box Protection
date: 2026-07-31
tags: [runbook, backup, risk, truenas, ups]
status: open — top risk
---

# Runbook: Backup Strategy & Off-Box Protection

## Why this matters
**No off-box backup is the #1 identified risk in the homelab.** Everything below is on-box. A single catastrophic event (fire, theft, ransomware, pool failure beyond RAIDZ2) loses the lot: 36 TiB media, Immich photos, Vaultwarden vault, Renewals JSON, app configs.

## Current state (verified 2026-07-31)
| Layer | Status |
|---|---|
| tank pool | RAIDZ2 (2-disk fault tolerance), scrub Sundays, zero errors |
| apps pool | single NVMe stripe — **NO redundancy** |
| Snapshots | hourly tank/apps + apps pool → replicated to `tank/backups/apps-pool`. tank/photos + tank/data still need periodic snapshot tasks |
| SMART | short weekly, long monthly, all pass |
| Email alerts | TrueNAS → Gmail app password, working |
| UPS | Vertiv Liebert GXT present, **NUT graceful shutdown NOT configured** |
| Off-box | **NONE** |

## Plan (priority order)
1. **Choose an encrypted off-box provider** (decision + 1-2 hrs). Candidates: Backblaze B2, Wasabi, rsync.net, or a friend's NAS over Tailscale. Requirement: encryption before upload (rclone crypt / restic / Borg), provider-agnostic.
2. **Stand up restic or Borg** on the NAS backing up (in priority order): Vaultwarden (`/mnt/tank/apps/vaultwarden` or its DB), Renewals JSON, app configs under `/mnt/tank/apps/`, Immich photos (`tank/photos`), then media (36 TiB — likely tiered: newest/irreplaceable first, or accept media loss).
3. **Restore test** — mandatory, from scratch, before calling it done. A backup that has never been restored is a hypothesis.
4. **Configure UPS NUT** — free, prevents corruption: TrueNAS → System → Services → UPS, pick the Vertiv driver, set graceful shutdown policy + runtime before shutdown.
5. **Snapshot tasks** for tank/photos and tank/data (currently missing).

## Acceptance criteria
- [ ] Encrypted off-box repository exists offsite
- [ ] Scheduled backup job runs without error 7 days straight
- [ ] One full restore test passed (vault + photos at minimum)
- [ ] UPS graceful shutdown verified (kill AC power, box shuts down cleanly)

## Related
- [[HOMELAB-KB]] · [[HERMES-CONFIG-DECISIONS]]
