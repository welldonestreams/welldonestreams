# Worklog

Use this file only for durable intent that is not clear from the code or commit
message. Git history remains the source of truth. Add entries newest first and
commit an entry with the change it describes.

**All new entries go at the top of `## Entries`, above the previous newest
entry — never below the `## Entry template` section at the bottom.**

## Entries

- 2026-07-26 — Docs/security: added a phone-number regex check to
  `.githooks/pre-commit` that blocks any commit staging content with `+1`
  followed by a 10-digit US number (with or without common separators), or
  the specific known-leaked digits. Rationale: two independent incidents on
  this public repo already, both from pasted third-party session content
  (a DeepSeek dump on 2026-07-25 and a Codex paste on 2026-07-26), where
  the phone number was not caught before push. Documenting the risk in
  `AGENTS.md` was not enough — this makes it a hard check, not a hopeful
  norm. Bypassable with `--no-verify` when there's a legitimate need to
  commit an example phone-shaped string.

- 2026-07-26 — Docs: corrected the SHA in the "phone-number exposure in
  git history" security flag entry below. Exposure is real — number
  `+1REDACTED` appears four times in commit `3760f78` ("Revise WORKLOG
  with latest monitoring updates"), not commit `e59be91` as originally
  recorded. Verified by fetching both commits' `.diff` directly from
  github.com. Underlying content is the July 25 DeepSeek session summary
  that was cleaned out of the working tree the same day; the cleanup did
  not touch history.

- 2026-07-26 — Homelab: diagnosed and fixed Plex playback failing on the
  user's iPhone and TV over LAN wifi (works on PC over wifi and on
  cellular). Root cause was TrueNAS's Plex app running in Docker bridge
  mode (`ix-plex_default`) with only `32400/tcp` published to the host —
  GDM/broadcast discovery ports (`1900/udp`, `32410/udp`,
  `32412-32414/udp`, `32469/tcp`) never reached the LAN, so native Plex
  apps couldn't discover the server locally while browsers (which bypass
  GDM and hit `plex.welldonestreams.com` directly through NPM) and
  cellular (which skips LAN discovery entirely) both worked. Fix: enable
  Host Network in the TrueNAS Plex app's Networking config. Verified via
  `ss -tulnp` that Plex now binds `32400/tcp` and the GDM UDP ports
  directly on the host, and playback confirmed on iPhone wifi via the
  native app afterward. Full diagnosis chain — including five ruled-out
  theories worth naming so a future session doesn't repeat them — is in
  `HOMELAB-HANDOFF.md`. One durable side artifact: an AdGuard custom
  filter rule `||steak^` was added during diagnosis after finding real
  20-second DNS timeouts on DNS-SD queries under the OPNsense local
  domain `steak.`. That rule was not the fix here (`plex.welldonestreams.com`
  resolves via instant AdGuard rewrite, not through that upstream path),
  but it's a legitimate keep — those timeouts were unrelated dead weight
  slowing other queries.

- 2026-07-26 — **Security flag, unresolved, needs the user's decision:** a
  Codex commit pushed to `origin/main` (SHA `3760f78`, "Revise WORKLOG with
  latest monitoring updates" — **SHA corrected from an earlier version of
  this entry, which mis-attributed the leak to `e59be91`; verified by
  fetching both commits' diffs**) contained the user's phone number in
  cleartext **four times** inside a pasted DeepSeek session summary. This
  repo is public. The working-tree content has been cleaned up in later
  commits, but **the number is still visible in that commit's diff in git
  history on GitHub** — removing it from the working tree does not remove
  it from history. This is a repeat of an incident already documented
  elsewhere in this file (the July 25 Kuma/Signal cleanup entry, "leaked
  the user's phone number three times into a public repo") — same
  underlying DeepSeek dump, same leak, caught after push not before.
  Deliberately not force-pushed or history-rewritten by an agent — that's
  a destructive, hard-to-reverse operation on shared history that needs
  the user's explicit go-ahead. If the user wants it actually scrubbed:
  `git filter-repo --replace-text` targeting that one string, followed by
  a force-push and everyone re-cloning, would do it — but decide with the
  user first, and consider whether the number itself needs to be treated
  as compromised regardless (e.g. if it is not solely a Signal-relay
  burner number).
- 2026-07-26 — Homelab (user + Codex, earlier in the night than the entries
  below): finished the two remaining Phase 2 Kuma items — monitor
  dependencies configured (DNS/ping monitors as parents for hostname
  monitors) and the two ~50%-uptime monitors fixed, confirmed via 3 Signal
  notification test attempts before it worked as expected. Also added
  monitors for `mail-archiver.welldonestreams.com` and raw-IP checks on
  Tautulli/NPM. Not independently re-verified by Claude this session (no
  Kuma login available); treat as user-reported until someone with console
  access confirms the monitor list directly.
  Separately, the user attempted setting up Actual Budget by manually
  importing bank CSVs, but the resulting balances didn't match after
  import. Considering paying a one-time $1.50 for SimpleFin to do the
  initial import correctly, then handle ongoing updates via manual CSV
  uploads after that. Also asked for the Actual Budget hostname to change
  from `actual.welldonestreams.com` to `budget.welldonestreams.com` — done,
  see the rename entry below.
- 2026-07-26 — Homelab: deployed Beszel (host + container metrics dashboard)
  per `HOMELAB-GAMEPLAN.md` Phase 7's pre-approved "after uptime monitoring
  is stable" recommendation. Dataset `tank/apps/beszel` (standard ACL), hub
  container `beszel` (port 8090, data at `hub_data`) and agent container
  `beszel-agent` (host network, read-only Docker socket mount, data at
  `agent_data`). **Deployed via plain `docker compose up -d` over SSH, not
  the TrueNAS Apps UI** — the TrueNAS web session had expired and this was
  done late at night without prompting the user, so it won't appear in
  TrueNAS's Installed Apps list or get middleware-managed updates/backups
  the way Kuma/Tailscale/etc. do. Redeploying it through Apps -> Discover
  Apps -> Custom App with the same compose content (saved at
  `/mnt/tank/apps/beszel/docker-compose.yml`) would bring it under normal
  management if that's wanted later; not done here to avoid touching
  TrueNAS's app database without being able to verify the result end to end.
  Added AdGuard rewrite + NPM proxy host (`beszel.welldonestreams.com` ->
  `10.0.0.162:8090`, wildcard cert, LAN Only, matching every other internal
  name) and a Homepage tile with the widget wired to
  `{{HOMEPAGE_VAR_BESZEL_USER}}`/`{{HOMEPAGE_VAR_BESZEL_PASS}}`. Verified
  `https://beszel.welldonestreams.com` returns HTTP 200.
  **Not done — needs the user:** create the hub's first admin account at
  that URL, then Add System for the TrueNAS host to get a real TOKEN/KEY,
  edit those two placeholder values in
  `/mnt/tank/apps/beszel/docker-compose.yml`, and run
  `docker compose up -d --force-recreate beszel-agent` (it's currently
  stopped, not crash-looping, to avoid pointless log noise overnight). Also
  add the real `HOMEPAGE_VAR_BESZEL_USER`/`_PASS` env vars to Homepage's
  TrueNAS app config once the account exists, same pattern as every other
  Homepage credential. None of this involved the agent creating or knowing
  any account password — consistent with the credential boundary held all
  session (sudo password, Tailscale auth key, Tailscale API token).
- 2026-07-26 — Casino: `HOMELAB-GAMEPLAN.md`'s "non-homelab open work" note
  claimed the Worker already supported craps field/place/prop bets and only
  the frontend was missing. Checked the actual `welldonestreams-worker` repo
  (main and its only other branch) and found that claim was false — only
  Pass Line existed. Built both sides: added `betType`/`number` handling to
  the Worker's craps case (field 1:1 with 2:1/3:1 on 2/12, place bets at
  standard 9:5/7:5/7:6 odds, props at 30:1/15:1), merged as
  `welldonestreams-worker#2`, then built the matching `casino.html`/
  `js/games/craps.js` bet-type picker and committed it here. Not verified in
  a live browser this session — worth a smoke test of each new bet type
  before trusting it fully.
- 2026-07-26 — Homelab: renamed the Actual Budget hostname from
  `actual.welldonestreams.com` to `budget.welldonestreams.com` per user
  request. Updated the AdGuard Home DNS rewrite and the NPM proxy host
  (domain swapped in place, same backend `10.0.0.162:31012`, same wildcard
  cert — no new certificate needed). Verified `budget.welldonestreams.com`
  returns HTTP 200 and `actual.welldonestreams.com` now correctly fails to
  resolve. Updated hostname-list references in `HOMELAB-GAMEPLAN.md` and
  `HOMELAB-HANDOFF.md`; left the historical narrative entries describing the
  original 2026-07-25 rollout intact with an added rename note rather than
  rewriting history. **Not done:** the Uptime Kuma monitor still targets the
  old `actual.welldonestreams.com` hostname and will start failing health
  checks — Kuma requires its own login this session didn't have credentials
  for, so the monitor's URL needs updating by hand (Settings on the
  `actual.welldonestreams.com` monitor → change target to
  `https://budget.welldonestreams.com`).
- 2026-07-26 — Homelab: added Uptime Kuma, Tailscale, and Actual Budget tiles
  to Homepage's `/mnt/tank/apps/homepage/services.yaml` (Infrastructure
  group), matching the existing `HOMEPAGE_VAR_*` secret-reference pattern.
  Uptime Kuma is a plain link (no Kuma status-page slug exists yet, and Kuma
  "does not yet have a full API" per its own Homepage widget docs, so no
  live-stats widget was possible without one). Tailscale uses Homepage's
  official `tailscale` widget (`deviceid: nzXB3KcLVg11CNTRL`, a non-secret
  stable identifier, plus `{{HOMEPAGE_VAR_TAILSCALE_KEY}}` for the actual API
  access token, which the user added themselves as a new Homepage
  environment variable — not typed in by the agent). Verified live after a
  Homepage container restart: the Tailscale tile renders real device data
  (address, last-seen, key-expiry countdown).
- 2026-07-26 — Homelab: deployed Tailscale as a subnet router on TrueNAS
  (container `tailscale`, dataset `tank/apps/tailscale`, advertising
  `10.0.0.0/24`), per a user-authored deployment brief now saved at
  `TAILSCALE-DEPLOY.md` (not committed — contains no secrets but is
  session-scratch in intent). Pre-work snapshot `apps@pre-tailscale-20260725`
  taken first. The brief's ACL command was wrong for this host's
  `nfs4xdr_setfacl` (0.3.3): its `-m` flag does an in-place single-ACE swap,
  not "set ACL" — used `-s` instead, which is the correct flag for a fresh
  dataset. `truenas_admin` had no working sudo automation path (interactive
  TTY password required on every call, blocking non-interactive SSH
  entirely); the user added passwordless sudo for that account themselves
  after being walked through it — the agent did not see or type the sudo
  password, consistent with never handling account credentials directly.
  Container is authenticated and running. **Not yet complete as of this
  writing:** the `10.0.0.0/24` subnet route is advertised but has not been
  approved in the Tailscale admin console — confirmed by checking both a
  Windows peer's and the container's own `PrimaryRoutes` (both empty) after
  the user believed it was done. Split DNS and a genuine off-LAN
  verification are also still open. See the 2026-07-26 section in
  `HOMELAB-HANDOFF.md` for full detail and the exact remaining steps.
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
