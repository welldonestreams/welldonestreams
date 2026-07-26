# Worklog

Use this file only for durable intent that is not clear from the code or commit
message. Git history remains the source of truth. Add entries newest first and
commit an entry with the change it describes.

**All new entries go at the top of `## Entries`, above the previous newest
entry — never below the `## Entry template` section at the bottom.**

## Entries
-ADMIN ENTRY- PLEASE DELETE, REPHRASE AND UPDATE ALL OTHER PAGES LIKE THE GAMEPLAN

SETUP KUMA, ADDED EVERYTHING TO IT, MADE EVERYTHING 3 ATTEMMPTS BEFORE NOTIFING ON SIGNAL.
STARTED SETTTING UP ACTUAL BUDGET BUT ITS A PAIN IN THE ASS. ID LIKE TO CHANGE THE NAME FROM ACTUAL.WELLDONESTREAMS TO BUDGET.WELLDONESTREAMS.
I MANUALLY IMPORTED BANKING CSVS BUT THE TOTALS WERE NOT COORRECT AFTER IMPORT. POTENTIALLY GOING TO PAY 1.50 FOR SIMPLEFIN IF I ONLY HAVE TO DO IT ONCE. ID LIKE TO PAY ONE TIME HAVE SIMPLEFIN IMPORT IT ALL THEN JUST DO MANUAL UPPLOADS AFTER THAT.

HERE IS DEEPSEEKS SUMMARY FOR WHAT WE DID, TAKE IT WITH A GRAIN OF SALT CUZ DEEPSEEK IS RETARDED.
# Homelab Monitoring & Alerting Setup – Work Log (2026-07-25)

## 1. Signal REST API (10.0.0.162:9922)
- Deployed `bbernhard/signal-cli-rest-api` container on TrueNAS SCALE.
- Mode: `json-rpc-native` (working).
- Volume: `/mnt/tank/apps/signal-api` mapped to `/home/.local/share/signal-cli`.
- Port mapping: `9922:8080`.
- Tested API: `/v1/about` → 200 OK.
- Registered account: `+1REDACTED`.
- Linked device: `kuma-alerts` via QR code (opened `http://10.0.0.162:9922/v1/qrcodelink?device_name=kuma-alerts`).
- Test send: `curl -X POST ...` – message received on Signal app.

## 2. Uptime Kuma (home.welldonestreams.com)
- Already running, with 25+ monitors for all internal and external services.
- Added custom Signal notification webhook:
  - Post URL: `http://10.0.0.162:9922/v2/send`
  - Number: `+1REDACTED`
  - Recipients: `+1REDACTED`
- Template: basic `{{ msg }}` (working).
- Test alert triggered by creating a fake monitor (`10.0.0.253`) – received DOWN and UP notifications via Signal.

## 3. DNS Monitor (home.welldonestreams.com)
- Created to catch DNS failures.
- Initial resolver `1.1.1.1` failed because the domain is internal (ENOTFOUND).
- Corrected resolver to `10.0.0.162` (AdGuard Home on NAS).
- Condition: `record equals 10.0.0.162`.
- Now reporting UP (though still flapping – will increase Retries to 2).

## 4. Added Missing Monitors
- `mail-archiver.welldonestreams.com`
- `10.0.0.162:30047` (Tautulli IP)
- `10.0.0.162:8181` (NPM IP)
- (Still to add: `https://welldonestreams.com/api/poll` – Worker API)

## 5. Cleanup & Next Steps
- Duplicate monitors (`home.welldonestreams.com` and `welldonestreams.com`) – will delete extras.
- Set Retries to 1 or 2 on all monitors to avoid false alerts.
- Set up monitor dependencies: DNS monitor + `10.0.0.162` ping as parents for all hostname-based monitors.
- Enable Domain Expiry notifications (cert expiry warning) – set to 30 days.
- External watcher (UptimeRobot) to be configured next for WAN/NAS total outage detection.

-END OF ADMIN, PLEASE MAKE SURE EVERYTHING I TYPED ABOVE THIS IS GONE NEXT TIME YOU UPDATE. UPDATE ALL FILES WHERE NESSECARRY-


- 2026-07-25 — Docs: rewrote `HOMELAB-GAMEPLAN.md` around a new "What to do
  next, in order" punch list so the user has one flat, prioritized view
  instead of needing to scan every phase for open checkboxes. Reordered by
  effort/urgency: quick checks first (TrueNAS test email, Sonarr/Elio queue
  items), then the two ~50%-uptime Kuma monitors and dependency setup, then
  the off-box backup provider decision (flagged as time-sensitive — the
  user's own first-week-of-August target is about a week out), then the
  remaining media-automation and network items, then non-homelab work.
  Corrected the Phase 5 Recyclarr item: `HOMELAB-HANDOFF.md` already records
  a successful manual sync with no material changes, so the only remaining
  step is turning on the schedule, not re-running the preconditions.

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
