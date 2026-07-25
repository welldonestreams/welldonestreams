# Worklog

Use this file only for durable intent that is not clear from the code or commit
message. Git history remains the source of truth. Add entries newest first and
commit an entry with the change it describes.

**All new entries go at the top of `## Entries`, above the previous newest
entry — never below the `## Entry template` section at the bottom.**

## Entries

- 2026-07-25 — Docs: found the same stale "recovery notification not yet
  tested" contradiction also survived in `HOMELAB-HANDOFF.md` (two spots:
  the Open Kuma follow-ups list and the Intentional follow-ups summary),
  even though that same file's own Signal channel note says it was already
  confirmed by stopping and restarting an app. Amended both in place.

- 2026-07-25 — Docs: fetched origin and found Codex had already pushed 4
  commits reformatting `HOMELAB-GAMEPLAN.md`/`HOMELAB-HANDOFF.md`/`WORKLOG.md`
  (fast-forwarded locally, no conflicts). The local working tree separately
  still had the user's original raw Kuma/Signal scratch notes appended to
  `HOMELAB-GAMEPLAN.md`, already superseded by that reformat, so it was
  stashed and dropped rather than reapplied. One real gap remained: the
  reformatted Phase 2 open items still listed the Signal recovery
  notification test as not performed, but both the user's raw notes and
  Codex's own worklog entry below confirm it was tested (stop/restart an app,
  DOWN and UP both received). Checked that item off to remove the
  contradiction.

- 2026-07-25 — Homelab: deployed Uptime Kuma with 24 monitors and wired up a
  three-tier alerting design. Signal via a local `bbernhard/signal-cli-rest-api`
  container on `10.0.0.162:9922` (MODE=normal) is the primary channel — it's
  the only path that doesn't share a Gmail/WAN dependency with everything else.
  Gmail SMTP is the secondary channel. The T-Mobile email-to-SMS gateway was
  attempted and abandoned as unreliable; if SMS ever becomes necessary,
  Twilio/ClickSend rather than a carrier gateway. UptimeRobot free tier
  monitors `welldonestreams.com` and `requests.welldonestreams.com` from
  off-site as the required external watcher. Kuma sits behind NPM at
  `kuma.welldonestreams.com` with the wildcard cert and LAN Only access list.
  DOWN and UP alerts on Signal were confirmed by stopping and restarting an
  app. Phone number was intentionally not committed to this public repo.

- 2026-07-25 — Homelab: cleaned up `HOMELAB-GAMEPLAN.md` by merging the
  night's Kuma/Signal work into Phase 2 as checked items and removing the raw
  "delete below and reformat" scratchpad and a DeepSeek-generated session
  summary that had been appended below the definition of done. The DeepSeek
  summary contradicted the user's own notes on two points (Signal REST mode,
  and whether the T-Mobile SMS gateway worked) and leaked the user's phone
  number three times into a public repo. Kept only what was independently
  confirmed. Recorded the two remaining Phase 2 opens: monitor dependencies
  are not set up, and two monitors (`home.welldonestreams.com` DNS-type and
  the raw `tautulli` IP monitor) are sitting at ~50% uptime and need to be
  either fixed or removed.

- 2026-07-25 — Docs: corrected two stale contradictions in
  `HOMELAB-HANDOFF.md` that could cause an agent to redo finished work. The
  "wildcard certificate is required" note and the "`actual.welldonestreams.com`
  returns NXDOMAIN" gap were both already resolved elsewhere in the same file
  but had been left standing. Both are now struck through and marked RESOLVED
  in place. Convention going forward: when an item is resolved, amend the
  original claim rather than appending a contradicting one below it.

- 2026-07-25 — Homelab: reworked the Phase 2 Uptime Kuma plan in
  `HOMELAB-GAMEPLAN.md`. The original plan ran Kuma on `10.0.0.162` and
  monitored ~14 services that all live on `10.0.0.162`, resolved through
  AdGuard which is also on `10.0.0.162` — so it could not have alerted on a
  NAS, DNS, or WAN outage, and both notification channels shared one Gmail SMTP
  dependency that also fails when the WAN is down. Added a required external
  watcher (free tier, off-site), monitor dependencies to suppress alert
  storms, a container-DNS smoke test before building the full monitor set,
  the `tank/apps` ACL step, certificate-expiry monitoring ahead of the
  2026-10-23 wildcard expiry, and the missing vault/requests/npm monitors.

- 2026-07-25 — Homelab: verified OPNsense's split DNS listener design (Dnsmasq
  LAN:5354 and AdGuard upstream:5353), closing the documented DNS-loop review
  without changing firewall or DHCP policy.

- 2026-07-25 — Homelab: confirmed the restored `actual.welldonestreams.com`
  AdGuard rewrite and LAN-only HTTPS proxy route end to end; updated the shared
  Phase 6 checklist to remove the stale NXDOMAIN exception.

- 2026-07-25 — Homelab: user decided Uptime Kuma's alert channels (email via
  existing Gmail SMTP + SMS via T-Mobile's email-to-SMS gateway) and deferred
  the off-box backup provider decision to roughly the first week of August
  2026. Neither the phone number nor email address was written to this repo
  since it's public; both go only into Kuma's own notification config.

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
