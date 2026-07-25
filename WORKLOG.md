# Worklog

Use this file only for durable intent that is not clear from the code or commit
message. Git history remains the source of truth. Add entries newest first and
commit an entry with the change it describes.

## Entries

- 2026-07-25 — Homelab: worked Phase 6 of the gameplan (network/access review)
  from a LAN client. Verified 16 of 17 internal HTTPS hostnames resolve and
  respond correctly and confirmed none have a public DNS record. Found
  `actual.welldonestreams.com` is missing its AdGuard rewrite despite being
  listed as created — needs a follow-up fix. OPNsense-side checks (DNS loop,
  DHCP bypass) remain open; no OPNsense access this session.

- 2026-07-25 — Refreshed `HOMELAB-GAMEPLAN.md`'s environment section (stale
  since the internal HTTPS rollout in commit e53db04) and verified from a LAN
  client that both open items in that rollout — Homepage's allowed-hosts
  setting and `switch.welldonestreams.com` routing — already work end to end.
  Recorded both as resolved in `HOMELAB-HANDOFF.md`.

- 2026-07-25 — Added `scripts/check-landing-page.mjs` and a shared
  `.githooks/pre-commit` hook (wired via `core.hooksPath`) so a future
  `index.html` minification/cleanup pass can't silently drop the onerror
  badge fallbacks, preview-mode mock poster URLs, or the double-rAF poll-bar
  animation again — the exact three regressions found in commit 35478c6 and
  fixed in commit 9863ab4.

- 2026-07-25 — Homelab firewall protection: exported and XML-validated a fresh
  OPNsense configuration backup outside the appliance; the private backup file
  is intentionally excluded from Git.

- 2026-07-25 — Homelab media correction: verified Radarr's intended title is
  *The Invite* (2026), not *The Invitation*; preserved its current CAM file as a
  temporary correct-title match and recorded the future quality-upgrade path.

- 2026-07-25 — Homelab follow-up: retargeted and retested TrueNAS email alerts,
  replaced the Elio full-disc Blu-ray job with a protected 2160p WEB-DL regrab,
  recorded the still-blocked OPNsense export, and added Claude's PC crash
  questions and verified diagnostic boundaries to the shared handoff.

- 2026-07-25 — Homelab: completed the live baseline, protected and upgraded four
  apps, verified current snapshots/scrubs/SMART health, added non-overlapping
  SMART cron schedules, tested email alert delivery, diagnosed media queue
  exceptions without destructive imports, verified remote paths and categories,
  and confirmed Recyclarr profiles are current.

- 2026-07-23 — Homelab: added `HOMELAB-GAMEPLAN.md` as the shared Codex/Claude
  execution plan. It records the real NZBGet and `/data/usenet` environment,
  current import/unpack issues, Uptime Kuma as the next application, storage
  health checks, off-box backup priorities, and the definition of done.

- 2026-07-23 — Homelab: migrated Homepage secrets to environment variables,
  repaired Renewals ownership/orchestration, added ZFS snapshot schedules,
  deployed LAN-only trusted HTTPS names, and hardened OPNsense administration.
  See `HOMELAB-HANDOFF.md` for verified state and follow-ups.

- 2026-07-22 — Keep shared handoff context current after important decisions,
  while minimizing routine narration and token use.
- 2026-07-22 — Added shared agent guidance. Verified that commit `4510bdc`
  already synchronizes casino navigation `aria-pressed` state and dispatches a
  game-leave event; those items must not be treated as open work.

## Entry template

```text
- YYYY-MM-DD — Scope: decision, reason, and any important follow-up.
```
- 2026-07-25 — Homelab: confirmed the restored `actual.welldonestreams.com`
  AdGuard rewrite and LAN-only HTTPS proxy route end to end; updated the shared
  Phase 6 checklist to remove the stale NXDOMAIN exception.
- 2026-07-25 — Homelab: verified OPNsense's split DNS listener design (Dnsmasq
  LAN:5354 and AdGuard upstream:5353), closing the documented DNS-loop review
  without changing firewall or DHCP policy.
