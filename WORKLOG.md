# Worklog

Use this file only for durable intent that is not clear from the code or commit
message. Git history remains the source of truth. Add entries newest first and
commit an entry with the change it describes.

**All new entries go at the top of `## Entries`, above the previous newest
entry — never below the `## Entry template` section at the bottom.**

## Entries

- 2026-07-28 — Renewals: extended the self-hosted app's billing model with a
  `Custom months` cycle (1–120 months). It now stores the selected interval,
  displays it on the renewal card, and annualizes the price correctly instead
  of treating every nonstandard interval as yearly. Added only statement-backed
  recurring records to the live tracker; existing entries were de-duplicated.
  Cards now show the renewal cadence and charge followed by the calculated
  monthly average. The backend persists both custom intervals and lifetime
  purchase dates; lifetime purchases are excluded from both the UI and
  `/api/next` totals while their on-card monthly average falls over time from
  the original purchase amount.
  The bulk editor was patched to preserve custom interval values as well, after
  the initial version exposed a lost-interval regression during verification.
  A historical payment is not proof that a bill remains active: one closed
  payment was removed immediately after the user confirmed its status.
  Transfers, loan payments, utility usage, ordinary purchases, and ambiguous
  repeat merchants were deliberately excluded. No statement exports or
  financial identifiers were copied into this public repository.

- 2026-07-28 — AdGuard Home: verified local DNS forwarding through OPNsense
  (`10.0.0.1:5353`), DNSSEC, and the current managed blocklists. Tuned only
  the cache: raised it from 4 MB to 32 MB and enabled optimistic caching. This
  reduces repeat local-name lookups without changing rewrites, upstreams,
  filters, or client access. Filter protection remains enabled and all active
  lists had updated successfully the same day.

- 2026-07-28 — Plex: corrected an unsafe database-cache setting. The requested
  50,000 MB cache exceeded both the TrueNAS host's 15 GB RAM and Plex's 4 GB
  container limit while the host had under 1 GB available. Set it to 512 MB,
  retained enabled Intel hardware transcoding, moved intro/credit detection to
  the overnight maintenance window, and disabled ad detection, chapter-preview
  generation, deep media analysis, and automatic trash emptying. This keeps
  playback responsive and protects library metadata from a transient mount
  issue without changing media files.

- 2026-07-28 — Homelab: replaced the previously fragmented Sonarr/Radarr
  quality-profile setup with one intentional policy in each app, at the user's
  request: `1080p with 720p Fallback`. It is assigned to all 92 series and 361
  movies, the one Sonarr and six Radarr import lists, and all 114 Radarr
  collection rules; the old selectors were removed only after those references
  moved. This is deliberately more than renaming profiles: automatic list and
  collection additions must inherit the same policy or the library drifts back
  to old settings. It allows normal 720p/1080p HDTV, WEB, and Blu-ray releases,
  retains the managed safety custom formats, allows upgrades, and excludes
  2160p and Remux qualities. Existing media was left untouched.
  The immediate Black Clover failure was thereby resolved: the old WEB-only
  Sonarr profile rejected otherwise-valid 1080p HDTV anime releases. A real
  episode-170 search then sent a valid release to NZBGet; only a small
  follow-up search batch was used, rather than repeating the rate-limit-prone
  full-series search. DOGnzb remains intentionally removed after repeated
  rate-limit failures.

- 2026-07-28 — Homelab: verified the media-import hardlink constraint before
  treating it as a defect. `zfs list -r -o name,mountpoint tank/data` confirms
  `tank/data/usenet` and `tank/data/media` are separate ZFS datasets. Hardlinks
  cannot cross a dataset boundary, so Sonarr/Radarr imports from the completed
  Usenet area are copies under the current design. Added the fact and a
  deliberate future migration decision to Phase 5 of `HOMELAB-GAMEPLAN.md`;
  no media, dataset, application, or path configuration was changed.

- 2026-07-27 — Homelab: added a Recyclarr tile to Homepage's Automation group,
  but **not** the way it was proposed. Another agent supplied a snippet with
  `href: https://recyclarr.welldonestreams.com`. That hostname is NXDOMAIN
  (verified against AdGuard), has no NPM proxy host, and could not have one:
  Recyclarr is a scheduled CLI container that exposes **no ports at all**
  (`docker inspect` shows no `ExposedPorts`). The snippet would have produced a
  permanently dead tile, and following it further would have meant creating a
  proxy host for a backend that does not exist.
  Durable point beyond this one tile: `*.welldonestreams.com` naming has been
  applied so consistently to this stack that a nonexistent name reads as
  plausible. Confirm a service actually serves HTTP before giving it a
  hostname — the trusted-name list in `HOMELAB-GAMEPLAN.md` is the set that
  does, and Recyclarr is deliberately absent from it.
  The tile points at `https://recyclarr.dev` instead, matching how Trakt/TMDb
  are handled — a reference destination that loads, rather than a LAN link that
  404s. Config backed up to
  `services.yaml.bak-before-recyclarr-20260727`; Homepage hot-reloaded it with
  no restart and the entry is live in `/api/services`.

- 2026-07-27 — Homelab: audit finding 8 (dead SNMP Trap alert route) closed —
  **the user disabled SNMP.** Durable lesson, and it is the opposite of what
  the docs briefly said: an agent safety guard blocked the unattended disable
  on 2026-07-26 because it reduces alerting, the item was left for a human,
  and the human did it a day later. The guard worked exactly as designed.
  Recording that because the interim reading was that the finding had been a
  false alarm and the guard had protected a no-op — wrong on both counts, and
  a future agent drawing that conclusion would learn to distrust both the
  audit findings and the guards.
  How the wrong reading happened is the transferable part. Codex's live review
  (commit `966dab9`) observed only the enabled E-Mail alert service and
  correctly recorded the observation, but inferred from it that the earlier
  "SNMP Trap enabled" claims had been mistaken. The state had simply *changed*
  between the two observations, via a user action neither agent saw. **A
  disappeared finding is more often a fixed finding than a false one** — check
  whether someone acted before concluding the earlier reading was wrong.
  Bookkeeping fixed alongside: that commit recorded its correction only as a
  new "Verified health" bullet, leaving three contradicting claims live in
  `HOMELAB-HANDOFF.md` (now amended in place per the stale-contradiction
  rule), and appended its `WORKLOG.md` entry below `## Entry template` at the
  bottom of the file, which the file's own header explicitly forbids (moved to
  the top of `## Entries`).

- 2026-07-27 — Homelab: measured the disputed 1080p orphan count on the box.
  **8 files remain, so both documents were wrong** — the handoff claimed all
  49 were still on disk, the gameplan claimed all 49 were deleted, and the
  deletion had actually run against ~41 of them and stopped short. Durable
  lesson, worth more than the number: when two agent-written documents
  disagree about physical state, the answer is usually a third thing, and
  neither is worth trusting even as a starting guess. The verification-first
  structure added earlier the same day is what surfaced it; a coin-flip
  between the two claims would have been wrong either way. Consequence
  recorded in the handoff: the `pre-1080p-standardize-20260726` snapshot must
  **not** be destroyed on the ~2026-08-09 expiry assumption while the count is
  non-zero — it is still the rollback for an unfinished purge, not dead weight
  holding 1.4 TB.

- 2026-07-27 — Homelab docs: reconciled a contradiction that could have cost
  1.4 TB, and recorded three verified facts. Durable reasoning:
  `HOMELAB-HANDOFF.md` said the 1080p orphan files were still on disk awaiting
  a human delete; `HOMELAB-GAMEPLAN.md`, written later the same session, said
  they were already deleted and only snapshot-held. Both described the same
  49 files / 1.42 TB. An agent reading the handoff first would have re-run a
  completed bulk media deletion. **Structural fix, not just a text fix:** the
  handoff is now the single source of truth for that operation and the
  gameplan is forbidden from restating on-disk status — one operation's state
  living in three sections across two files is what allowed the drift, and the
  same shape will cause it again. The status is written as a live verification
  command with both branches spelled out, because neither document could be
  trusted to know the answer.
  `/tmp/orphans.py` was promoted to `scripts/orphans.py` in this repo. The
  punch list depended on a script in `/tmp` — one reboot from gone — with a
  recovery pointer to a script that was never actually in the handoff. It is
  read-only by design and takes `RADARR_KEY` from the environment, since
  deleting user media is correctly a human action and the key must never be
  committed.
  Verified facts recorded: `tank`'s first-ever scrub finished clean
  (`0B repaired`, 0 errors, 10.7 TB) — the top-priority open risk is closed;
  a UPS **is** physically installed, correcting "no UPS" (that reading came
  from an empty `ups.config`, which only proves TrueNAS isn't reading the
  battery — the remaining gap is graceful shutdown, not hardware); and
  OPNsense SSH is confirmed disabled.
  Also promoted the audit's `midclt call ssh.config` lesson from a buried
  finding to a standing `AGENTS.md` security rule. It leaked private SSH host
  keys into a transcript, and "query specific fields, not whole config
  objects" generalizes past that one call — same category as the phone-number
  incident, so it belongs where agents actually read it.
  Stripped a UTF-8 BOM from `HOMELAB-GAMEPLAN.md` (PowerShell
  `Out-File -Encoding utf8` adds one; use `utf8NoBOM`). Same class of
  invisible-character bug as the U+2060 that got mobile uploads banned.

- 2026-07-26 — Homelab: standardized the library on 1080p (Radarr; Sonarr was
  already correct). Full state and the one unfinished step are in
  `HOMELAB-HANDOFF.md` under "1080p standardization". Durable reasoning:
  Moving movies to a 1080p profile is **not sufficient on its own** — Radarr
  ranks Remux/2160p *above* Bluray-1080p and never downgrades, so those
  files show as cutoff-*met* and are silently left alone. Confirmed
  empirically: after reassigning all 336 movies to profile 7, cutoff-unmet
  returned 106 and every one was a movie with no file at all. Reaching
  "strictly 1080p" therefore requires deleting the higher-tier files so
  Radarr re-grabs within profile. Anyone revisiting this should not expect
  a profile change alone to do anything to existing 4K/Remux media.
  Second trap, worth knowing before trusting the API: `DELETE
  /api/v3/moviefile/bulk` returned HTTP 200 and removed the database
  records, but **left every file on disk**. The library looked clean from
  Radarr's side while 2.28 TB of orphans remained in the movie folders.
  Always verify on-disk state after that endpoint rather than trusting the
  response code.
  A recursive `tank/data/media@pre-1080p-standardize-20260726` snapshot was
  taken before any deletion, deliberately converting an irreversible media
  purge into a reversible one — the established pre-work-snapshot pattern in
  this homelab, and the reason the unfinished cleanup is safe to leave
  pending rather than urgent.

- 2026-07-26 — Homelab: acted on the audit below. Full change list is in
  `HOMELAB-HANDOFF.md` under "2026-07-26 — Audit remediation"; the durable
  reasoning that the diff won't show:
  The `apps`-pool fix is deliberately **local replication to `tank`, not a
  second snapshot task**. Snapshots on a single-disk pool are worthless
  against that disk dying, which was the actual risk — so the value is in
  the copy landing on raidz2, and a snapshot task alone would have looked
  like a fix without being one.
  Radarr's BR-DISK fix was applied at **two layers on purpose**: import
  lists repointed to the Recyclarr-managed profile 7 (fixes new additions),
  *and* BR-DISK scored -10000 across profiles 1-6 (fixes the 332 movies
  already assigned to the old profiles). Doing only the first would have
  left the existing library still able to grab discs. Note that Radarr's
  BR-DISK custom format is a title-regex heuristic — it caught 26 items but
  is not a guarantee, so full-disc releases can still slip through under a
  mis-parsed quality.
  ARC was capped at 8 GB rather than left unset because this box is a
  15.4 GB N100 with **no swap**; an unbounded ARC plus ~9 GB of containers
  is how you get an OOM kill instead of cache eviction. Swap was
  deliberately *not* added — swapfiles on ZFS risk deadlock, so capping ARC
  is the correct lever here.
  SSH password auth was disabled only after verifying key auth works; the
  TrueNAS web shell is the documented fallback if a client ever loses keys.

- 2026-07-26 — Homelab: ran a full read-only audit of the TrueNAS box and
  cross-checked it against these documents. Findings recorded in
  `HOMELAB-HANDOFF.md` under "2026-07-26 — Full system audit"; nothing was
  changed on the system. Durable intent worth keeping out of that list:
  the audit was prompted by wanting an optimization pass, but what it
  actually surfaced were three data-durability gaps that outrank any new
  app — `tank`/`apps` have never been scrubbed, the single-NVMe `apps` pool
  holds three Postgres databases with no redundancy *and* no periodic
  snapshot task, and there is still no off-box backup. Treat those as
  blocking before installing anything else.
  Two documentation claims were corrected in place rather than appended to,
  per this repo's stale-contradiction rule: "TrueNAS has enabled SNMP" (the
  SNMP *service* is stopped; only the SNMP Trap *alert service* is on, so
  those alerts silently go nowhere) and "pool scrub tasks remain enabled"
  (enabled, but never actually run on `tank` or `apps`).
  Also recorded the hardware baseline for the first time — Intel N100, 4
  cores, 15.4 GB RAM, no swap — because several findings (memory headroom,
  ARC sizing, Immich lacking QuickSync passthrough) only make sense with
  that context, and no prior document stated it.

- 2026-07-26 — Homelab: deployed Paperless-ngx (document management/OCR) via
  TrueNAS's middleware API directly (`midclt call app.create`), not the Apps
  UI or raw `docker compose` — scripted equivalent of the UI flow, still
  fully middleware-tracked (shows in Installed Apps, covered by ZFS
  snapshots). Used the community catalog app (`paperless-ngx` 1.6.37 /
  app 3.0.2), which bundles Postgres 18, Redis (Valkey), Tika, and
  Gotenberg — no separate custom-compose stack needed. Pre-work recursive
  snapshot `tank/apps@pre-paperless-20260726`. Dataset
  `tank/apps/paperless` with host-path storage for `data/`, `media/`,
  `consume/` (standard `Group-apps`/`truenas_admin` ACL); `trash` and
  Postgres data use ixVolumes. DB/Redis/Django-secret-key values were
  generated server-side and never left the TrueNAS host. Web UI on
  `10.0.0.162:30070`.
  Hit two issues getting it reachable at `https://paperless.welldonestreams.com`:
  (1) the NPM proxy host's Forward Host was mistyped as `10.0.0.1`
  (OPNsense) instead of `10.0.0.162` (TrueNAS) — found by reading NPM's
  sqlite `proxy_host` table read-only, fixed in the NPM UI; (2) Django CSRF
  verification failed behind the reverse proxy until `PAPERLESS_URL` (and
  `PAPERLESS_CSRF_TRUSTED_ORIGINS`) were added via the app's
  `additional_envs` config and applied with `app.update` — the catalog
  app's schema has no dedicated field for this, so it has to go through
  `additional_envs` for any Paperless instance deployed this way.
  Admin bootstrap password was rotated by the user immediately after first
  login, as intended.
  Still open: Homepage tile, Kuma monitor, and the consume-folder SMB
  share vs. API-token decision from the original deploy brief.

- 2026-07-26 — Homelab: consolidated Beszel to a single hub. TrueNAS Apps had
  spun up a second hub (`ix-beszel-hub-beszel-1`, port 30333, middleware-
  managed) alongside the original raw `docker compose up -d` hub (`beszel`,
  port 8090, dataset `tank/apps/beszel`) — both had empty "No systems found"
  databases, so this was pure consolidation, not data migration. Kept the
  TrueNAS-Apps-managed hub since it survives upgrades cleanly; the old raw
  hub container is gone (removed outside this session, likely a manual
  `docker compose down` — its compose file at
  `/mnt/tank/apps/beszel/docker-compose.yml` is now stale reference only,
  left on disk). Deployed a fresh `beszel-agent` container on the TrueNAS
  host (`~/beszel-agent/docker-compose.yml`, host network, port 45876)
  registered against the new hub via a per-system public key/token pair
  generated from its "Add System" dialog (not reproduced here — treat as a
  credential-shaped string, same discipline as the phone-number redaction
  rule below). Repointed NPM's existing `beszel.welldonestreams.com` proxy
  host from `10.0.0.162:8090` to `10.0.0.162:30333`, keeping the existing
  cert and `LAN Only` access list. Verified `https://beszel.welldonestreams.com`
  returns HTTP 200 against the new hub. Homepage's `services.yaml` beszel
  widget already referenced the domain rather than a raw port, so it needed
  no change.

- 2026-07-26 — Docs/security, closing this incident: filed a GitHub Support
  ticket (via the Support Virtual Assistant flow, category "cached dangling
  commit removal") requesting a purge of cached views for the four dangling
  commits that showed the leaked phone number after the `git filter-repo`
  history rewrite: `3760f78`, `988d446`, `fbab899`, `33bc3b6`. Confirmed no
  forks of this repository exist and none of the four commits are referenced
  by any pull request, so this ticket covers every remaining known exposure
  surface GitHub controls. Ticket was accepted; no fixed SLA given. Also
  added a direct note in `AGENTS.md`'s Security section asking Codex to
  purge the number from any of its own resources outside this git repo
  (session memory, cached context, logs) — the git-level fix and the
  Support ticket only reach what's inside this repository.
  **Status: fully resolved.** GitHub Support confirmed the same day
  (2026-07-26, ~20:11 UTC) — cache clearance was run, all four dangling
  commit URLs now return 404, ticket marked Solved. Nothing further to do
  on this incident.

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
  git history" security flag entry below. Exposure is real — the leaked
  phone number appears four times in commit `3760f78` ("Revise WORKLOG
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
- 2026-07-27 — Homelab: applied OPNsense Dnsmasq DHCP option 6 to distribute
  AdGuard Home (`10.0.0.162`) as the DNS server to renewed client leases.
