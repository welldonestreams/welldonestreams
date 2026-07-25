# Worklog

Use this file only for durable intent that is not clear from the code or commit
message. Git history remains the source of truth. Add entries newest first and
commit an entry with the change it describes.

## Entries

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
