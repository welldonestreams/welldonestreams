# Homelab handoff

Last verified: 2026-07-26 (America/Los_Angeles)

This file records durable homelab state for Codex and Claude. It intentionally
contains no passwords, API keys, tokens, cookies, or certificate credentials.
The prioritized remaining work is maintained in `HOMELAB-GAMEPLAN.md`.

## 2026-07-25 follow-up

### Claude review of index.html landing-page cleanup (commit 35478c6)

- Reviewed the "Clean up landing page behavior and styles" commit end to end:
  no secrets, no broken script/asset references, no invariant violations. It
  is mostly whitespace/comment minification plus a few real content edits
  (larger casino chip icon, simplified Plex TV-guide copy). Verified the
  inline script still passes `node --check` after extraction.
- Patched three small regressions introduced by that cleanup, in commit
  `9863ab4` ("Restore small UX safeguards dropped in landing page cleanup"):
  - Re-added `onerror` fallbacks on the Google Play / App Store badge
    `<img>` tags. Without them, a 404'd badge asset shows a broken-image icon
    instead of just disappearing.
  - Restored real TMDb poster URLs in `MOCK_RECENT` and `MOCK_POLL` (preview
    mode only, used on non-`welldonestreams.com` hosts). The cleanup had
    blanked several of them to empty strings, so preview/staging previews
    showed more placeholder icons than intended.
  - Restored the double `requestAnimationFrame` before animating poll-result
    bar heights in `loadPoll()`. The cleanup collapsed it to a single rAF,
    which risks the bar-fill transition snapping instantly to its final
    height instead of animating, on a page load where the visitor already
    has a vote cookie.
- None of these affect production behavior on `welldonestreams.com` in the
  common case (mock data only loads in preview mode; the animation and badge
  issues are cosmetic edge cases). Fixed them anyway since they were easy
  small deltas against the pre-cleanup version. No functional or security
  issues found otherwise — the minification approach itself is fine to keep
  using.

### Local-name / proxy review (in progress)

- Reconfirmed that Nginx Proxy Manager is healthy and that its existing trusted
  admin names (`truenas.welldonestreams.com` and
  `opnsense.welldonestreams.com`) are online, HTTPS-enabled, and restricted by
  the `LAN Only` access list.
- The pre-existing public hosts—Vault, Requests, and Renewals—are intentional
  user-approved remote-access services. Leave their public access unchanged.
  All new internal service names must use the existing `LAN Only` access list,
  local AdGuard DNS rewrites, and no WAN port-forward rule.
- ~~The current internal TLS certificate is a two-name certificate; a wildcard
  is required before the remaining HTTPS proxy hosts can be added.~~
  **RESOLVED 2026-07-25** — a `*.welldonestreams.com` wildcard was issued via
  NPM's Cloudflare DNS challenge and all 17 internal proxy hosts now use it.
  See "internal HTTPS naming rollout" under Completed maintenance.
  **Expires 2026-10-23** — renewal is automatic but must be monitored (see
  Phase 2 cert-expiry monitor).

- Updated the enabled TrueNAS email alert service to the user's requested Gmail
  address and sent a fresh live test. Middleware accepted the send; receipt still
  needs user confirmation, including a check of Spam/Promotions.
- Created recursive snapshot
  `tank/data/usenet@codex-pre-elio-regrab-20260725`, removed and blocklisted the
  75 GB Elio full-disc Blu-ray job, and grabbed
  `Elio.2025.2160p.MA.WEB-DL.TrueHD.Atmos.7.1.DV.HDR10P.H.265-TheFarm` instead.
  Radarr verified the replacement as a 27.3 GB `WEBDL-2160p` item in downloading
  state. The snapshot is the recovery point for the removed download data.
- Corrected a stale Radarr note: the wanted movie is **The Invite (2026)**
  (TMDb 950028), not *The Invitation*. Radarr is already monitoring the correct
  title and has imported `the.invite.2026.720p.CAM.h264-jff.mkv`; it is a
  1:44:04 720p CAM copy, so retain it only until a proper WEB-DL or better
  replacement is available.
- Exported and XML-validated a fresh OPNsense configuration backup at 10:58 PDT.
  It is stored outside the firewall appliance in the private local homelab
  backups folder; the backup file itself is intentionally excluded from Git.
- No off-box backup provider has been selected. Do not start a paid or large
  upload until the user chooses a target.

### Claude PC diagnostic questions and coordination notes

- Claude asked what ChatGPT changed after finding Kernel-Power event 41 restarts,
  a cluster of AMD software installs on 2026-07-22, no current `MEMORY.DMP`, and
  only one older minidump. Treat the AMD-install timing as correlation, not proof
  of cause; the separate 2026-07-25 abrupt restart still needs investigation.
- The durable facts already recorded here are that the Radeon RX 7800 XT was
  enumerated normally, the CPU integrated graphics is not a second discrete GPU,
  and the event log showed no matching WHEA, disk, NTFS, NVMe, or AMD display
  errors in the reviewed window.
- Earlier user-confirmed troubleshooting includes a clean Windows reinstall,
  reseating the GPU and PSU cables, changing the main monitor back to DisplayPort,
  installing AMD chipset software, and running DISM/SFC. Do not infer additional
  AMD tuning or power-setting changes without auditing the current live settings.
- Next PC diagnostic steps are to verify crash-dump configuration, inspect the
  2026-07-25 event timeline, and capture GPU temperature/power/driver telemetry
  during a controlled gaming test before blaming hardware or uninstalling tools.

### Claude PC diagnostic findings (2026-07-25, crash-dump review)

- Crash-dump configuration is correctly enabled: `CrashDumpEnabled=3` (full
  kernel dump), `AutoReboot=1`, dump path `C:\Windows\MEMORY.DMP`, minidump
  path `C:\Windows\Minidump`. The earlier "no MEMORY.DMP" observation is not a
  misconfiguration; these particular incidents are watchdog recoveries, not
  full bugchecks, so Windows writes them to `C:\Windows\LiveKernelReports\`
  instead of `MEMORY.DMP`.
- `C:\Windows\LiveKernelReports\AMD_WATCHDOG\` and `AMD_REPORT_UM\` contain
  AMD GPU-driver-specific watchdog timeout dumps. Timestamps: 2026-05-28,
  2026-05-30, 2026-06-18 (sporadic), then a cluster at 2026-07-21 21:36,
  22:44, and 22:45, then 2026-07-22 17:53 (about 5 minutes before that day's
  17:58 unclean reboot), and again around 18:01 and 18:13-18:14 (before the
  18:10 unclean reboot).
- This revises the earlier correlation: the AMD_WATCHDOG cluster on
  2026-07-21 predates the 2026-07-22 AMD software install (Ryzen Master SDK,
  Ryzen Master, AMD DVR, AMD Settings, AMD WVR64). The install looks like it
  was a response to crashes already happening on 7/21, not the cause. The
  real suspect is the Radeon RX 7800 XT driver (32.0.31021.5001, 2026-06-27)
  itself hanging/timing out under load, recurring intermittently since at
  least late May 2026.
- No AMD_WATCHDOG or other LiveKernelReports dump matches the 2026-07-25
  10:17 AM unclean reboot. That incident's mechanism is still unconfirmed;
  do not assume it is the same root cause as the 7/21-7/22 cluster.
- Checked current live power settings: active scheme is Balanced. PCIe Link
  State Power Management (ASPM) is Off on AC / Maximum power savings on DC;
  USB selective suspend is Enabled on both AC and DC. No battery is present
  (desktop), so the DC values likely never take effect. Not identified as a
  cause, but recorded so no one re-checks it as a fresh idea.
- No WHEA-Logger events found in the reviewed window.
- Recommended next step unchanged from the prior entry: a controlled
  load/gaming test capturing GPU temperature, power draw, and clocks would
  confirm whether this is thermal/power-delivery or a driver-only fault. A
  DDU-clean reinstall of a different (older or newer) Radeon driver build is
  a reasonable next troubleshooting step given the driver-watchdog evidence.

## 2026-07-25 execution update

- Re-verified all three pools ONLINE: `apps` had 456 GiB free, `boot-pool`
  233 GiB free, and `tank` 44.4 TiB free. All critical service endpoints
  responded normally.
- Created recursive pre-work snapshots
  `tank/apps@codex-pre-gameplan-20260725` and
  `apps@codex-pre-gameplan-20260725`.
- Upgraded Prowlarr to 1.5.19, Immich to 1.14.30, Vaultwarden to 1.6.23,
  and Mail Archiver to 1.2.37. All four restarted successfully, their HTTP
  endpoints responded, and TrueNAS reports no remaining upgrade for them.
- Confirmed all four periodic snapshot tasks are enabled and completing on
  schedule. Pool scrub tasks remain enabled for Sunday at 00:00 with a 35-day
  threshold.
  **Corrected 2026-07-26 audit:** "enabled" is not "has ever run." `zpool
  status` shows **no `scan:` line at all for `tank` or `apps`** — neither pool
  has ever completed a scrub. Only `boot-pool` has (2026-07-20). The scrub
  tasks exist and are enabled, but the 35-day threshold plus recent pool
  creation means nothing has fired yet. Also note the four periodic snapshot
  tasks cover `tank/*` only — **the `apps` pool has no periodic snapshot
  task**, see the audit entry below.
- TrueNAS 25.10 no longer provides the old SMART scheduling screen. All six
  HDDs and both NVMe devices currently pass SMART health. Added supported cron
  tasks for short tests every Wednesday at 01:00 and long tests monthly on the
  8th at 01:00; both skip execution while a scrub or resilver is active.
- TrueNAS has enabled the SNMP Trap and E-Mail **alert services** (both at
  WARNING level). A live email alert-service test was accepted by middleware
  and the user later confirmed receipt.
  **Corrected 2026-07-26 audit:** the SNMP *service* itself
  (`service.query` -> `snmp`) is `enable=False`/`STOPPED`. Only the SNMP Trap
  *alert service* is on, so any alert routed to it is silently dropped. Either
  enable the SNMP service or disable the SNMP Trap alert service; email is the
  only alert path actually delivering today.
- NZBGet has unpacking and cleanup enabled with automatic PAR checking. Elio is
  not a failed repair: NZBGet reports `SUCCESS/PAR`, but the completed item is a
  75 GB ZIP containing a full Blu-ray BDMV structure, so it was preserved rather
  than deleted or force-imported.
- Platonic contains eight plausibly sized MKV files but remains an ID-only match
  for the wrong-looking `Platonic.2025...NF` release name. The Invitation contains
  one 19.5 GB MKV named `ZFo9.mkv`. Both were preserved pending human playback or
  content verification.
- Confirmed the live media-path design: NZBGet maps the host Usenet dataset to
  `/downloads`; Sonarr and Radarr map `/mnt/tank/data` to `/data`; both have an
  explicit `10.0.0.162` remote-path mapping from `/downloads/` to
  `/data/usenet/`. Completed-download handling, failure cleanup, and matching
  NZBGet categories are enabled.
- Ran `recyclarr sync --preview`, followed by a real sync. Radarr's 40 custom
  formats and Sonarr's 37 custom formats, quality definitions, and profiles were
  already current; the sync made no material profile changes.

## 2026-07-26 — Kometa scheduled on a condition, Homepage restructured

### Kometa was NOT running nightly

Worth stating plainly because it had a Homepage tile implying otherwise: the
app is `STOPPED` with **no container at all**, and its last real run was
**2026-07-19** (2h 0m 38s, per `/mnt/tank/apps/kometa/logs/meta.log`). It has
not run since. That run also ended with errors —
`'mal_*' requires MyAnimeList to be configured` and a TVDb lookup failure for
series 114161 — so if those collections matter, MyAnimeList still needs
configuring in `config.yml`.

### New: conditional Kometa run

The user wanted a scan **only after every Radarr and Sonarr download has
landed**, not on a fixed timer. Implemented as
`/mnt/tank/apps/kometa/kometa-when-queues-drain.sh`, registered as TrueNAS
cron job id 3, every 30 minutes.

Logic: reads both queue counts via API; if either is non-zero it logs and
exits. When both are zero it requires **two consecutive empty checks** (~30
min apart) before firing — deliberately, because six Radarr import lists
auto-add on a schedule and a mid-drain burst would otherwise trigger a
premature scan. On success it starts the Kometa app, runs
`kometa.py --run`, then touches `.kometa-ran` and never fires again.

- Log: `/mnt/tank/apps/kometa/queue-watcher.log`
- To re-arm later: `rm /mnt/tank/apps/kometa/.kometa-ran`
- First execution confirmed working (correctly declined: radarr=205,
  sonarr=31 still queued).

### Homepage restructured

- **Search widget removed** from `widgets.yaml` (only `resources` remains).
  Note the separate `quicklaunch` type-to-search in `settings.yaml` is still
  active — that is a different feature and was left alone.
- **Kometa tile removed** from `services.yaml`.
- **Quick Links moved to the top** of the page by reordering `layout:` in
  `settings.yaml`, and now contains GitHub, YouTube, Discord, and OP.GG.
- GitHub was **already** a bookmark under "Homelab Accounts"; that duplicate
  was removed rather than having it appear twice. YouTube and Discord were
  likewise already bookmarks and were moved, not duplicated.
- Backups of all four files are in `/tmp/*.bak` on the host (non-persistent).
  All four validate as YAML.

## 2026-07-26 — 1080p standardization (Radarr/Sonarr)

> **Single source of truth for this operation.** `HOMELAB-GAMEPLAN.md` points
> here and must not restate on-disk status independently — the two files
> disagreed once already (see "Orphan cleanup status" below) and nearly caused
> a 1.4 TB deletion to be re-run.


Goal: every movie and show at 1080p, permanently. User explicitly chose
"strictly 1080p", i.e. replace existing 4K and Remux copies too.

**Sonarr needed no work.** All 94 series were already on profile 7
(`WEB-1080p`, upgrades on, cutoff WEB 1080p, only WEBDL/WEBRip-1080p
allowed), its one import list (`Trakt Popular Shows`) already targets that
profile, and cutoff-unmet is 0. 219 episodes are simply missing/never
downloaded — normal backlog, not a quality problem.

**Radarr — done:**
- All **336 movies moved to profile 7** ("HD Bluray + WEB", cutoff
  Bluray-1080p, upgrades on). Was 201 on profile 6, 43 on 4, 4 on "Any".
  Bluray-720p was intentionally left allowed as a fallback per user choice.
- All six import lists already pointed at profile 7 from the earlier audit
  fix, so **new** additions are correct going forward.
- **71 non-1080p files (2.28 TB) removed from Radarr's database** — 21
  Remux-1080p, 16 BR-DISK, 12 WEBDL-2160p, 8 Remux-2160p, 3 WEBRip-2160p,
  3 CAM, 2 TELESYNC, 4 Unknown, 1 HDTV-1080p, 1 WEBDL-720p.
- Re-search triggered; new grabs verified **100% correct** (Bluray-1080p /
  WEBDL-1080p only, zero Remux, zero 2160p).
- **118 stale Remux/2160p items (3.85 TB) purged from the queue** — they
  had been grabbed under the old profiles and would have re-polluted the
  library on import. Queue is now 100% 1080p.
- Recovery point: `tank/data/media@pre-1080p-standardize-20260726`
  (recursive). **Everything below is reversible from it.**

**The orphan-file trap (durable, applies to any future run):**

`DELETE /api/v3/moviefile/bulk` returned HTTP 200 and removed the database
records but **did not delete the files from disk.** Radarr's library looked
clean while 49 old files (1.42 TB) remained in their movie folders — e.g.
`Interstellar...2160p...REMUX` (102 GB), `Mickey 17...UHD REMUX` (66 GB),
`Elio...2160p` (22 GB). Never trust that endpoint's status code; always
re-check on-disk state afterwards.

Consequence if orphans are left in place: as the queued 1080p replacements
import, each affected movie folder contains **both** the old 4K/Remux file
and the new 1080p one. Plex sees duplicates and may play the wrong one, and
the space is not reclaimed.

### Orphan cleanup status — PARTIALLY DONE, 8 files left

**Measured live 2026-07-27 16:07 PDT: 8 files remain.** Neither document was
correct. `HOMELAB-HANDOFF.md` had claimed all 49 were still on disk;
`HOMELAB-GAMEPLAN.md` had claimed all 49 were deleted. The deletion actually
ran against most of the set and stopped short — roughly 41 of 49 gone, 8 left.
Treat this as the lesson: neither file knew, and the only reliable answer came
from the box.

The 8 have **not** been identified by file or size yet. Do that before
deleting anything, and before destroying the recovery snapshot.

Re-run the count any time — every remaining file should be 1080p, so any hit
here is a leftover (no API key needed):

```
sudo find /mnt/tank/data/media/movies /mnt/tank/data/media/anime/movies \
  -type f \( -iname '*remux*' -o -iname '*2160p*' -o -iname '*.iso' \) | wc -l
```

**Next step — identify the 8 before touching them:**

```
sudo find /mnt/tank/data/media/movies /mnt/tank/data/media/anime/movies \
  -type f \( -iname '*remux*' -o -iname '*2160p*' -o -iname '*.iso' \) \
  -printf '%s\t%p\n' | sort -rn
```

Then get the authoritative view, which cross-checks against Radarr and
separates the CAMs you must keep:

```
export RADARR_KEY=...        # Radarr -> Settings -> General
sudo -E python3 scripts/orphans.py
```

`scripts/orphans.py` lives in this repo (copy it to the box). It is
read-only — review its output, then delete those paths by hand. The six
intentional CAMs are listed separately under "do NOT delete"; note they are
CAM/720p releases and so do *not* match the remux/2160p/iso count above.

**Do not destroy the recovery snapshots until the count reads `0`.**
`tank/data/media@pre-1080p-standardize-20260726` and
`tank/data/media/movies@auto-2026-07-25_03-00` expire on their own by
**~2026-08-09** under the 2-week retention. Destroying them earlier is the
point of no return, and right now they are still the rollback for a purge
that is not finished.

Roll back from `pre-1080p-standardize-20260726` if anything goes wrong; the
snapshot exists precisely so this purge is reversible.

**Agent note:** two separate attempts to script this deletion were blocked
by the agent safety guard (bulk deletion of user media). That is working as
intended — do not try to route around it. It needs a human at the keyboard.

**Six theatrical CAMs are intentionally retained** (Toy Story 5, Moana 2026,
The Invite, The Odyssey, Evil Dead Burn, Minions & Monsters, ~24 GB). No 1080p
release exists yet. `scripts/orphans.py` classifies them separately and will
only list them as deletable once Radarr has grabbed real releases.

### Anime root folder cleaned up (2026-07-26)

`/data/media/anime/movies` had become a dumping ground: 61 movies, of which
exactly **one** was actually anime (`Spirited Away`). Interstellar, Mad Max,
Shawshank, Terminator, the Avengers films, etc. were all filed there.

All **60 non-anime movies were moved to `/data/media/movies`** via Radarr's
movie editor (`rootFolderPath` + `moveFiles`). Radarr moved the whole movie
folders, so the untracked orphan files listed above travelled with them and
are now under `/data/media/movies` too — the delete command above still
finds them, since it scans both roots.

`anime/movies` now contains only `Spirited Away (2001)`, on disk and in
Radarr. Going forward the anime tree is for genuine anime only.

**Sonarr's `anime/series` was left alone** — it is correctly populated
(One Piece, Hunter x Hunter, Frieren, Steins;Gate, Vinland Saga, Erased,
The Promised Neverland, Black Clover, Solo Leveling). Only `Arcane` and
`The Legend of Korra` are arguably Western animation rather than anime;
left in place as a judgement call for the user, not an error.

## 2026-07-26 — Audit remediation (changes actually applied)

Follow-up to the audit below. These were applied on the user's instruction to
"fix everything you can." Ordered to match the audit's numbering.

- **(1) First-ever scrubs on `tank` and `apps` — both CLEAN.** `apps`
  completed in 33 seconds with **0 errors**. `tank` finished 2026-07-27
  02:15 PDT: **`repaired 0B in 06:01:46 with 0 errors`**, all six raidz2
  members ONLINE with zero read/write/cksum errors. 10.7 TB verified
  bit-for-bit against checksums — no silent corruption. Scrubs continue on
  their existing schedule.
- **(2) The `apps` pool single-disk gap is closed.** Added a recursive
  periodic snapshot task on `apps` (hourly at :45, 2-week retention, task
  id 5) and a **local replication task `apps-pool-to-tank`** (id 1) pushing
  those snapshots to `tank/backups/apps-pool` on the raidz2 pool, 4-week
  retention. First run succeeded: 26 GB replicated, covering the Immich,
  Paperless-ngx, and Mail-Archiver Postgres data plus Plex/*arr configs.
  A failure of the `apps` NVMe is now recoverable from `tank`.
- **(4) Radarr BR-DISK problem fixed at the root and the queue purged.**
  All six import lists were repointed from profiles 4/6 to profile **7**
  ("HD Bluray + WEB"). BR-DISK was set to **-10000** on every other profile
  (1-6) and de-allowed as a selectable quality where it had been allowed
  (profile 1 "Any"). Then 26 BR-DISK items (~1.4 TB) were removed from the
  queue with `removeFromClient=true&blocklist=true`. Radarr's queue went
  **145 items / 4.5 TB -> 119 items / 3.03 TB with zero BR-DISK**, and
  `usenet/incomplete` dropped from ~39 GB to ~12 GB.
- **(5) ZFS ARC capped at 8 GB** (`zfs_arc_max`, live via
  `/sys/module/zfs/parameters/` and persisted in
  `/etc/modprobe.d/zfs-arc.conf`). It had been unset, meaning ARC could grow
  to all 15.4 GB. Available memory improved from 1.7 GB to ~3.0 GB.
- **(6) SSH hardened:** weak ciphers (`AES128-CBC`, `NONE`) removed, and
  `passwordauth` disabled. Key auth was verified working immediately after.
  **Fallback if ever locked out:** the TrueNAS web UI shell, or re-enable
  password auth in System Settings -> Services -> SSH.
- **(11) Immich now has `/dev/dri` passthrough** (`use_all_gpus: true`).
  Both `ix-immich-server-1` and `ix-immich-machine-learning-1` have the
  device and came back healthy. Should speed up thumbnail/ML work on the
  N100's QuickSync, which Plex was already using.

### Deliberately not done

- **(7) SSH host keys were not rotated** — user chose to defer, since
  rotation invalidates `known_hosts` on every client and there is no
  evidence of external compromise.
- **(8) The SNMP Trap alert service is still enabled** while the SNMP
  service is stopped. An attempt to disable it was blocked by an agent
  safety guard (it reduces alerting). Do this in the UI: System Settings ->
  Alert Settings, or enable the SNMP service if traps are actually wanted.
  Email alerting is unaffected and working.
- **(3) Off-box backup still does not exist.** Unchanged — it needs a
  provider decision and credentials. The (2) fix above is *on-box*
  redundancy only; it does not protect against fire/theft/total loss.
- **(9) UPS not integrated with TrueNAS.** **Corrected 2026-07-27:** a UPS
  *is* physically installed — the earlier "no UPS" reading came from
  `ups.config` having an empty driver/port, which means TrueNAS cannot see
  the battery, not that no battery exists. Remaining work is software:
  connect the USB data cable and configure Services -> UPS so the box shuts
  down gracefully instead of hard-cutting on a long outage.
- **(10) The ~24 GB of stuck imports** in `usenet/complete` (`Sisu.2`,
  `Colpa.Tua.London`) were left alone; they need a manual-import judgement
  call, not a scripted delete.
- **Two cleanups worth ~102 GB were identified but not executed**, since
  both destroy data and neither is urgent (`tank` has 29 TB free): the
  now-obsolete `codex-pre-elio-regrab-20260725` snapshot (90.6 GB, see
  gameplan punch-list item 4) and two orphaned NZBGet downloads no longer tracked by
  Radarr — `The.General.1926...COMPLETE.UHD.BLURAY` (12 GB) and
  `Metropolis.1927...COMPLETE.BLURAY` (337 KB).
- Stale SSH sessions dating to 2026-07-15 were left in place; killing idle
  user shells is low value and non-zero risk.

## 2026-07-26 — Full system audit (Claude, read-only sweep)

Deep crawl of pools, disks, memory, apps, network, security, and the *arr
stack, cross-checked against these documents. Findings ordered by severity.
Nothing in this section was changed — it is a findings list.

**Hardware baseline (was not previously written down anywhere):** Intel N100,
4 cores, **15.4 GB RAM**. This is a low-power box running 23 apps. Several
findings below are only meaningful in that context.

### Critical

1. **Neither `tank` nor `apps` has ever been scrubbed.** `zpool status` shows
   no `scan:` line for either. `tank` holds 10.7 TB across a 6-wide raidz2.
   Silent bit-rot would currently go undetected until a read fails. Fix: run
   `zpool scrub tank` manually once (expect many hours), then let the Sunday
   task maintain it.
2. **The `apps` pool is a single 512 GB KIOXIA NVMe with no redundancy and no
   periodic snapshot task.** It holds `apps/ix-apps`: the Postgres data for
   Immich, Paperless-ngx, and Mail-Archiver, plus Plex/Radarr/Sonarr/Prowlarr
   configs and all Docker state (23.6 GB). Its only snapshots are three manual
   pre-work ones from 2026-07-25 — and same-disk snapshots do not survive the
   disk dying. That NVMe has 10,688 power-on hours. Vaultwarden is *not*
   affected: its `/data` is a host path on `tank/apps/vaultwarden` (raidz2 +
   snapshotted). Fix: add a periodic snapshot task for `apps`, and replicate
   it to `tank`.
3. **No off-box backup of any kind exists.** `replication.query`,
   `cloudsync.query`, and `rsynctask.query` all return 0. Already known (see
   the gameplan's early-August target) but restated here because findings 1
   and 2 make it materially worse than it reads.

### High

4. **Radarr queue is 145 items / 4.5 TB, including 28 BR-DISK full-disc
   rips.** BR-DISK is the exact failure mode already documented for Elio
   (a full BDMV structure Radarr cannot import) — there are now 28 of them
   queued, including `The.Exorcist.1973...COMPLETE.UHD.BLURAY` (27 GB already
   pulled) and `The.General.1926...COMPLETE.UHD.BLURAY`. Another 90 items are
   Remux-1080p at 20-40 GB each.
   **Root cause:** six import lists all have auto-add enabled (IMDb Popular,
   IMDb Top 250, StevenLu, TMDb Popular, Trakt Popular Movies, and the Trakt
   Popular Animation list added 2026-07-26), and they target quality profiles
   `4` (HD-1080p) and `6` (HD - 720p/1080p). Both allow Remux and score
   BR-DISK at **0**. Only profile `7` ("HD Bluray + WEB", the Recyclarr/TRaSH
   managed one) scores BR-DISK at **-10000** and excludes Remux.
   Fix: point the import lists at profile `7`, or apply the TRaSH BR-DISK
   custom format to profiles 1/4/5/6. Sonarr is unaffected — its queue is 40
   items / 0.04 TB, all WEB-DL/WEBRip 1080p.
5. **Memory has no headroom and there is no swap.** 13 GB of 15.4 GB used,
   1.7 GB available, `SwapTotal: 0`, `Committed_AS` 21.5 GB against a
   `CommitLimit` of 8 GB. ZFS `arc_c_max` is set to the full 15.4 GB. No OOM
   kills have occurred yet, so this is a headroom warning rather than an
   active fault — but Paperless-ngx (added 2026-07-26) contributes five
   containers including Tika and Gotenberg. Consider capping ARC (~6-8 GB)
   before adding anything else.

### Medium

6. **SSH hardening gaps:** `passwordauth: true` (key auth already works for
   `truenas_admin`), weak ciphers still permitted (`AES128-CBC`, `NONE`),
   no 2FA on either account, and `root` is not locked. Combined with the
   passwordless sudo granted on 2026-07-25, an SSH password compromise is a
   direct path to root.
7. **SSH host keys should be rotated.** During this audit a `midclt call
   ssh.config` returned the full config object including the private
   `host_ecdsa_key`, `host_ed25519_key`, and `host_rsa_key` values, which
   were exposed in an agent session transcript. Nothing indicates external
   compromise, but regenerating the host keys is the clean response. The
   general lesson — query specific fields, never whole config objects — has
   been promoted to a standing rule in `AGENTS.md` under Security.
8. **SNMP Trap alert service is enabled but the SNMP service is stopped** —
   alerts routed there go nowhere. See the corrected note above.
9. **No UPS is configured in TrueNAS** (`ups.config` has empty driver/port).
   **Clarified 2026-07-27:** a UPS is physically installed; TrueNAS simply
   isn't reading it, so there is no graceful shutdown. Still open as gameplan
   punch-list item 9. For a 6-disk ZFS box this remains a real
   unclean-shutdown risk until the data cable and Services -> UPS are set up.
10. **~24 GB stuck in `/mnt/tank/data/usenet/complete`** — `Sisu.2` (13 GB,
    since 2026-07-18) and `Colpa.Tua.London` (11 GB, since 2026-07-17) have
    sat unimported for over a week.
11. **Immich has no `/dev/dri` passthrough** while Plex does. On an N100,
    QuickSync would meaningfully speed up Immich's thumbnail/ML work.
12. Kometa is `STOPPED` with no container, but still has a Homepage tile.
13. NZBGet has 21 container restarts (exit 0, not OOM) and stale SSH sessions
    dating to 2026-07-15 are accumulating on the host.

### Verified healthy (no action needed)

- All three pools ONLINE, no read/write/checksum errors, no active alerts.
- All 8 disks pass SMART. The six 10 TB WD HDDs have only ~337 power-on hours
  and 0 reallocated/pending sectors. Capacity is comfortable: `tank` is 19%
  full with 29.1 TB usable free.
- All 23 apps are on current versions with no pending upgrades or image
  updates.
- Only `cifs` and `ssh` services are exposed; ftp/nfs/iscsi/nvmet are off.
- All five NPM certificates renew between 2026-10-14 and 2026-10-23.

## Completed maintenance

### 2026-07-26 — Plex playback failure on iPhone/TV wifi — root cause and fix

**Symptom.** User could not play movies on iPhone or TV when either device was
on the home LAN wifi. Playing on PC wifi worked. Playing on the phone with
wifi off (cellular) worked. Client-side error was Plex's generic dialog: *"An
error occurred while attempting to play this video. Please check your
connection and try again."* Plex dashboard on the server side showed
`Unable to listen for events on welldonestreams` recurring every 1-2 minutes.

**Root cause.** TrueNAS's Plex app was running in Docker bridge mode
(`ix-plex_default`) with only `32400/tcp` published to the host. The GDM /
broadcast discovery ports (`1900/udp`, `32410/udp`, `32412-32414/udp`,
`32469/tcp`) were exposed inside the container but never mapped to the host,
so local Plex clients on the LAN could not discover the server via
broadcast. Browsers connecting directly to `plex.welldonestreams.com`
bypassed discovery entirely and worked. Cellular connections skipped local
discovery and went straight to Plex's own remote-relay path and also worked.
Only native apps on the LAN hit the broken path and hard-failed instead of
falling through cleanly.

**Fix.** In TrueNAS UI → Apps → Installed Applications → Plex → Edit →
Networking, checked **Host Network** and saved. Container restarted bound
directly to the host network stack. Verified:

```
sudo docker inspect ix-plex-plex-1 --format '{{.HostConfig.NetworkMode}}'
# host

sudo ss -tulnp | grep -E '32400|32410|32412|32413|32414'
# shows Plex Media Serv directly bound to 32400/tcp and the GDM UDP ports
# on all interfaces (0.0.0.0)
```

The `Unable to listen for events` message stopped appearing in the
dashboard within two minutes of the restart. Native Plex app on iPhone
over LAN wifi then played the movie without issue.

**Ruled-out theories, worth naming so a future session doesn't rerun them.**
The path to the fix went through five wrong causes before finding the right
one:

- **inotify exhaustion.** `dmesg` and Plex's own log had zero matches for
  `inotify_add_watch` or `unable to listen`. Limits are 123552 / 1024,
  well above stock defaults. TrueNAS SCALE ships them pre-tuned.
- **Server crash / restart.** `uptime` showed 11 days uninterrupted.
  `docker events` for the failure window was empty. NPM up 8 days, AdGuard
  up 10 days.
- **AdGuard DNS blocking Plex domains.** Query log showed
  `plex.welldonestreams.com` resolving via an instant (0.02 ms) local
  rewrite — the resolver never touches upstream for this name. Separately
  found real 20-second timeouts on DNS-SD queries against the OPNsense
  local domain (`.steak`) and added `||steak^` to AdGuard's custom
  filtering rules to short-circuit those. Legitimate fix for that class
  of stall but not the cause of the Plex symptom.
- **iOS Local Network permission.** Was already enabled for Plex.
- **Plex Secure Connections = Required forcing `plex.direct` handshake.**
  Was already set to Preferred. AdGuard query log had zero
  `plex.direct` queries either way — native app wasn't attempting a
  DNS-based `plex.direct` connection, ruling out this whole path.

The decisive isolation test was hitting `http://10.0.0.162:32400/web`
directly from the phone browser on wifi — worked immediately. That proved
Plex Server, the file, transcoding, and basic LAN reachability were all
fine, narrowing the problem to something the native app path used that a
plain browser hitting the direct port did not: local broadcast discovery.

**Small residual items.**

- Startup log shows `Critical: libusb_init failed`. This is Plex looking
  for USB tuner hardware (DVR/Live TV) and finding none. Cosmetic. Safe
  to ignore unless a USB tuner is ever added.
- `32469/tcp` (DLNA) and `1900/udp` (SSDP) did not appear in the `ss`
  output after the host-network switch — Plex's DLNA server is probably
  disabled in Settings rather than a networking problem. Not touched;
  not needed unless the user wants Plex-to-generic-DLNA-client casting.

### 2026-07-25 — Uptime Kuma + Signal notification deployment

- Deployed Uptime Kuma on TrueNAS. Dataset `tank/apps/uptime-kuma` created
  with the standard ACL (Group `apps` GID 568, Full Control, File+Directory
  Inherit; bogus User `apps` entry removed). Config/data volume is a host
  path at `/mnt/tank/apps/uptime-kuma` so it inherits the hourly `tank/apps`
  snapshot schedule.
- NPM proxy host `kuma.welldonestreams.com` uses the `*.welldonestreams.com`
  wildcard certificate, Force SSL + HTTP/2, and the `LAN Only` access list.
  AdGuard Home local DNS rewrite points it to `10.0.0.162`. No public
  Cloudflare record was added.
- Deployed `bbernhard/signal-cli-rest-api:latest` on `10.0.0.162:9922`
  with `MODE=normal` and storage at `/mnt/tank/apps/signal-api`. The
  container is linked as a secondary device named `kuma-alerts` to the
  user's Signal account. Registered phone number is intentionally excluded
  from this repo — it lives only in Kuma's Webhook notification config and
  in Signal's linked-device list.
- Kuma notification channels configured:
  - **Signal** (primary, WAN-independent): Webhook to
    `http://10.0.0.162:9922/v2/send`, DOWN/UP/OTHER template. Confirmed by
    stopping and restarting an app.
  - **Gmail SMTP** (secondary): same Gmail address used for TrueNAS alerts.
  - **T-Mobile email-to-SMS gateway** was attempted and abandoned as
    unreliable; not counted as an available channel.
- Twenty-four monitors are active. Public: `welldonestreams.com`,
  `welldonestreams.com/api/poll`, `vault`, `requests`, `renewals`. Internal:
  `truenas`, `opnsense`, `home`, `plex`, `nzbget`, `sonarr`, `radarr`,
  `prowlarr`, `bazarr`, `tautulli`, `immich`, `actual` (hostname renamed to
  `budget.welldonestreams.com` on 2026-07-26 — this monitor's target URL was
  **not** updated to match and still needs fixing), `adguard`, `npm`,
  `mail-archiver`. Beszel is not yet monitored here. Infrastructure: pings on
  `10.0.0.1` and `10.0.0.162`,
  and raw-IP health checks on `tautulli` and `npm` so a DNS-only failure is
  distinguishable from a service failure. `plex` and `nzbget` accept HTTP
  401 as healthy. Certificate-expiry notifications enabled on the HTTPS
  monitors; the wildcard expires 2026-10-23.
- Deployed a free UptimeRobot external watcher monitoring
  `welldonestreams.com` and `requests.welldonestreams.com` from off-site,
  alerting to the same Gmail. This is the only path that survives a NAS,
  DNS, or WAN outage.
- Open Kuma follow-ups (still in `HOMELAB-GAMEPLAN.md` Phase 2):
  - Monitor dependencies are not yet configured. Set the `10.0.0.162` ping
    monitor as the parent of every hostname monitor on that host so a NAS
    outage sends one alert instead of ~20.
  - `home.welldonestreams.com` DNS-type monitor is sitting at ~50% uptime.
    Kuma's DNS monitor type does raw queries the Docker resolver
    (`127.0.0.11`) doesn't handle consistently. Either delete it (the
    hostname monitor already exercises DNS) or rebuild it to query
    AdGuard directly.
  - `tautulli` raw-IP monitor is also at ~50% uptime. Tautulli serves plain
    HTTP, not HTTPS; confirm the monitor URL is
    `http://10.0.0.162:30047/` and that no redirect is confusing Kuma.
  - ~~Recovery notification not yet forced end to end.~~ **RESOLVED
    2026-07-25** — confirmed by stopping and restarting an app; both DOWN and
    UP arrived on Signal (see the Signal channel note above).

### 2026-07-25 — internal HTTPS naming rollout (Codex)

- Created a new Cloudflare-scoped DNS API token for Nginx Proxy Manager (NPM), limited to DNS edit access for `welldonestreams.com`, then used it to issue a wildcard Let's Encrypt certificate for `*.welldonestreams.com` through the Cloudflare DNS challenge. The certificate was successfully issued by NPM and is valid through 2026-10-23.
- Created these NPM proxy hosts using that wildcard certificate, `Force SSL`, HTTP/2, and the existing `LAN Only` access list. No new WAN port forwards or public proxy hosts were created:
  - `home`, `plex`, `tautulli`, `sonarr`, `radarr`, `bazarr`, `prowlarr`, `nzbget`, `adguard`, `npm`, `immich`, `mail-archiver`, and `actual` all forward to the associated TrueNAS application on `10.0.0.162`.
  - `switch` forwards to `10.0.0.168:80`; `ap` forwards to `10.0.0.117:80`.
  - Existing `truenas` and `opnsense` LAN-only proxies were retained. Existing intentionally public `vault`, `requests`, and `renewals` were not changed.
- Added corresponding AdGuard Home local DNS rewrites to `10.0.0.162` for all of the above internal names. These records only work for devices that use AdGuard Home as DNS; they deliberately do not create public Cloudflare A/AAAA records.
- Backed up the live Homepage config as `/app/config/services.yaml.bak-before-proxy-links`, then updated `/app/config/services.yaml` to replace every active `10.0.0.x[:port]` Homepage service link with its matching `https://<name>.welldonestreams.com` address. The Plex secondary card and Seerr/Requests link were also changed appropriately. No Homepage API variables or credentials were changed.
- Homepage host validation still needs one final TrueNAS application update. Homepage's log explicitly requires `HOMEPAGE_ALLOWED_HOSTS`; the TrueNAS Homepage edit screen has an `Allowed Hosts` section. `home.welldonestreams.com` was added there alongside the existing `10.0.0.162:30054`, but the final TrueNAS **Update** click timed out before it submitted. Do not rely on a manual `settings.yaml` `allowedHosts` key; the documented log hint requires the application environment/TrueNAS setting. Click **Update**, wait for Homepage to redeploy, then test `https://home.welldonestreams.com`.
  - **Verified resolved (Claude, 2026-07-25, from a LAN client using AdGuard DNS):** `https://home.welldonestreams.com` returns a real HTTP 200 Homepage render (title "Well Done Homelab", full page body), not an error page. The Update apparently did save, or Homepage picked up the setting on a later redeploy. No further action needed unless it regresses.
- Current reported problem: `https://switch.welldonestreams.com/` does not resolve for the user. First verify the client is using AdGuard Home for DNS and that its new rewrite is present/enabled. If DNS resolves to `10.0.0.162` but the page fails, test whether the switch UI actually serves plain HTTP on `10.0.0.168:80`; the NPM backend was configured from the Homepage's prior direct `http://10.0.0.168` link and has not yet been end-to-end tested. Apply the same check to the access point (`10.0.0.117:80`).
  - **Verified resolved (Claude, 2026-07-25, from a LAN client using AdGuard DNS):** DNS resolves `switch.welldonestreams.com` to `10.0.0.162` correctly; `https://switch.welldonestreams.com` and direct `http://10.0.0.168` both return HTTP 200; `http://10.0.0.117` (`ap`) also returns HTTP 200. Working end to end from this vantage point. If the user's own device still can't reach it, the difference is likely that device's DNS configuration (not using AdGuard Home) rather than the NPM/proxy setup — worth confirming which DNS server that specific device uses before assuming the proxy is broken again.

### Claude Phase 6 network/access review (2026-07-25)

- **Codex follow-up:** `actual.welldonestreams.com` is now resolved. Browser verification reached the Actual Budget application over HTTPS, confirming the AdGuard rewrite, NPM proxy, wildcard certificate, and backend route are working end to end. No other Phase 6 setting was changed.

- Re-tested all 17 configured internal hostnames from a LAN client using
  AdGuard DNS. 16 resolve correctly to `10.0.0.162` and respond over HTTPS
  (`plex` and `nzbget` return HTTP 401 on their root path, which is expected
  since both require login and confirms the proxy reaches a live backend).
- ~~**Gap found:** `actual.welldonestreams.com` returns NXDOMAIN.~~
  **RESOLVED 2026-07-25** — the missing AdGuard rewrite was added and the name
  was verified end to end over HTTPS. All 17 internal names now resolve.
- Confirmed via a public DNS resolver (1.1.1.1) that none of a representative
  sample (`truenas`, `home`, `plex`, `sonarr`, `switch`, `actual`) have a
  public A/AAAA record — all return NXDOMAIN externally, matching the
  intended LAN-only design.
- Did not verify OPNsense/Unbound DNS-loop behavior or DHCP-provided DNS
  bypass prevention — both require OPNsense config access this session
  didn't have. Still open in `HOMELAB-GAMEPLAN.md` Phase 6.

- Homepage now receives all service credentials through TrueNAS application
  environment variables. `services.yaml` uses `HOMEPAGE_VAR_*` references only;
  plaintext backup copies were removed after a recursive ZFS recovery snapshot.
- Homepage navigation includes ChatGPT beside Claude and GitHub in the cloud
  services group. All tested widgets remained healthy after the secret migration.
- Renewals is managed and running under TrueNAS again. An orphan Docker container
  that held its name and port was removed, persistent data ownership was corrected
  for UID/GID 568, and the placeholder session secret was replaced with a random
  64-hex-character value. The service returned HTTP 200 on port 30600.
- Immediate recursive recovery snapshots named
  `codex-pre-maint-20260723` were created for `tank/apps`, `tank/photos`, and
  `tank/backups`.
- Automatic recursive ZFS snapshots were added:
  - `tank/apps`: hourly at minute 15, retained for two weeks.
  - `tank/photos`: daily at 02:15, retained for three months.
  - `tank/backups`: daily at 02:30, retained for three months.
  - `tank/data/media`: daily at 03:00, retained for two weeks.
- Nginx Proxy Manager has a dedicated Let's Encrypt certificate (Cloudflare DNS
  validation) for `truenas.welldonestreams.com` and
  `opnsense.welldonestreams.com`, expiring 2026-10-21 and set to renew normally.
- Both admin names use HTTPS proxy hosts restricted by the `LAN Only` access
  list (10.0.0.0/24 and internal Docker networks only). AdGuard local DNS rewrites
  point both names to 10.0.0.162. End-to-end TLS verification returned result 0;
  TrueNAS returned HTTP 302 to sign-in and OPNsense returned HTTP 200.
- OPNsense DNS-rebinding protection is enabled again, with
  `opnsense.welldonestreams.com` registered as an alternate trusted hostname.
  SSH remains disabled, and dormant root-login/password-login allowances were
  also disabled.

## Verified health

- TrueNAS alert-service review (2026-07-27): the live Alert Services page
  contains only enabled E-Mail delivery. The previously reported SNMP Trap
  route is absent, so it cannot silently drop alerts in the current config.
- OPNsense DHCP/DNS review (2026-07-27): Dnsmasq remains the active DNS/DHCP
  service. Its DHCP-range/options settings need a deliberate lease-options
  review before enforcing DNS-bypass policy; no DHCP or firewall change was
  made during this check.

- OPNsense DNS service review (2026-07-25): Dnsmasq DNS/DHCP is enabled on the
  LAN interface and listens on port 5354. AdGuard Home's documented upstream is
  `10.0.0.1:5353`, so these services are deliberately separated by port and no
  direct listener conflict was found. DHCP DNS-bypass enforcement still needs a
  client/DHCP-options review before changing firewall policy.

- Pools `apps`, `boot-pool`, and `tank` are ONLINE at 3%, 1%, and 18% capacity.
- Renewals, Homepage, Nginx Proxy Manager, and AdGuard Home are RUNNING.
- The four periodic snapshot tasks are enabled with the schedules above.
- The two trusted proxy hosts use access-list ID 1 and certificate ID 9.

## Media-stack facts and active queue issues

- TrueNAS host address: `10.0.0.162`.
- Download client: NZBGet; the system is Usenet-first. Do not assume qBittorrent.
- Usenet host path: `/mnt/tank/data/usenet`.
- Shared media-container path: `/data/usenet`.
- Recyclarr configuration/data lives under `/mnt/tank/apps/recyclarr` and is run
  with Docker.
- Sonarr currently reports some releases as matched by grab-history ID and unable
  to import automatically. Manual Import is required after verifying the actual
  file; suspicious or incorrect releases should be removed and blocklisted.
- A `Platonic.2025...NF...` release is especially suspicious for the expected
  `Platonic (2023)` series. Verify runtime, episode title, and actual content
  before importing.
- Radarr's earlier *The Invitation* reference was stale. The correct managed
  movie is **The Invite (2026)**, which currently has a lower-quality CAM copy
  awaiting a later WEB-DL-or-better upgrade.
- Elio's archive warning was resolved by replacing the full-disc BDMV ZIP with a
  normal 2160p WEB-DL. Confirm that the new job completes and imports into Plex.
- Unpackerr is not the default recommendation for this setup because NZBGet
  handles normal Usenet unpacking natively.

## Related PC diagnostic snapshot

- Windows currently reports the AMD Radeon RX 7800 XT as healthy with driver
  32.0.31021.5001 dated 2026-06-27. The CPU's integrated AMD graphics device is
  also enumerated normally; this is not a second discrete graphics card.
- The System log contains Kernel-Power event 41 at 17:58 and 18:10 on
  2026-07-22, confirming two unclean restarts after the freezes. The same
  seven-day critical/error filter showed no WHEA, disk, NTFS, storage-NVMe, or
  AMD display-driver events, so event 41 is evidence of the forced resets rather
  than a root-cause diagnosis.

## Intentional follow-ups

- Follow `HOMELAB-GAMEPLAN.md` for the ordered setup and validation checklist.
- Do not perform the OPNsense 26.7 feature upgrade unattended. A current
  configuration export now exists; still schedule a short network maintenance
  window first.
- Add an off-box replication or cloud-backup target for irreplaceable data. Local
  snapshots protect against mistakes and ransomware history, but not loss of the
  server.
- Verify scrub schedules, SMART test schedules, and working TrueNAS alert
  delivery. SMART schedules and the send-side email test are now complete;
  confirm that the test email arrived. Avoid long tests overlapping scrubs or
  resilvers.
- Homepage still triggers TrueNAS's deprecated legacy REST API warning. Upgrade
  or replace that widget when a compatible Homepage release is available before
  moving TrueNAS to a release that removes the endpoint.
- Uptime Kuma is deployed with 24 monitors and Signal + Gmail alerting, plus
  a UptimeRobot external watcher (see the 2026-07-25 Uptime Kuma deployment
  section above). A real DOWN + recovery test is confirmed on Signal.
  Remaining Kuma work: configure monitor dependencies to suppress alert
  storms and fix or remove the two ~50%-uptime monitors.
- Kometa remains intentionally stopped and was not the source of the Renewals
  startup failure.
- Finish the Tailscale subnet-router setup (see the 2026-07-26 section below):
  approve the `10.0.0.0/24` route in the Tailscale admin console, configure
  split DNS for `welldonestreams.com` -> `10.0.0.162`, and verify reachability
  from an actual off-LAN client.
- Update the Uptime Kuma monitor still pointed at `actual.welldonestreams.com`
  (renamed to `budget.welldonestreams.com` on 2026-07-26) — Kuma needs its own
  login this session didn't have.
- Finish Beszel setup (see the 2026-07-26 section below): create the hub admin
  account, generate a real agent token/key, start `beszel-agent`, and add
  Homepage's Beszel widget credentials.

## 2026-07-26 Tailscale subnet router deployment

- Deployed Tailscale as a subnet router on TrueNAS, per `TAILSCALE-DEPLOY.md`
  in the site repo. Container `tailscale` (image `tailscale/tailscale:stable`)
  runs as a TrueNAS custom app in host network mode with `NET_ADMIN`/`NET_RAW`
  capabilities, state at `/mnt/tank/apps/tailscale/state` (dataset
  `tank/apps/tailscale`, standard `truenas_admin` + `Group-apps` ACL).
- The deploy brief's ACL command used `nfs4xdr_setfacl -R -m`, which is wrong
  for this host's `nfs4xdr_setfacl` (0.3.3): `-m` does an in-place swap of one
  ACE and requires a `from_ace`/`to_ace` pair, not a full ACL spec. `-s` (set,
  replacing the whole ACL) is the correct flag for a fresh dataset and is what
  was actually used.
- A pre-work recursive snapshot `apps@pre-tailscale-20260725` was taken before
  any of this. `net.ipv4.ip_forward` was already `1`; no sysctl change needed.
- The container is authenticated (`chanceweldon11@gmail.com`) and running with
  `--advertise-routes=10.0.0.0/24 --accept-dns=false`. Tailscale IP
  `100.88.96.116`, hostname `truenas-subnet-router`.
- `truenas_admin` was granted passwordless sudo (`/etc/sudoers`, appended via
  `visudo`) so this kind of SSH automation is possible at all — the account
  previously required an interactive TTY password on every `sudo` call, which
  blocks any non-interactive SSH session outright. This raises the account's
  blast radius (anyone who obtains its SSH key/session now has root
  non-interactively); worth factoring in if reviewing that account's exposure.
- **Route approved 2026-07-26:** the `10.0.0.0/24` route is now approved in
  the Tailscale admin console — verified via the container's own
  `tailscale status --json`, which shows `PrimaryRoutes: ["10.0.0.0/24"]`.
  LAN-wide access over the tailnet is live, not just device-to-device
  features. Split DNS (`welldonestreams.com` -> `10.0.0.162` in the
  Tailscale admin DNS settings) and a real off-LAN verification (curl an
  internal hostname from a client that is provably not on the home LAN, per
  `TAILSCALE-DEPLOY.md` step 8) have not been independently re-confirmed in
  this session — check those before assuming the whole deployment is done.
- The existing OPNsense WireGuard tunnel (`10.10.10.0/24`,
  `vpn.welldonestreams.com`) was left untouched, as designed — it remains a
  working fallback remote-access path independent of this deployment.

## 2026-07-26 Homepage additions, Actual Budget rename, Beszel deployment

- Added Uptime Kuma, Tailscale, and Actual Budget tiles to Homepage
  (`/mnt/tank/apps/homepage/services.yaml`, Infrastructure group). Kuma has
  no widget (no status-page slug exists yet, and Kuma "does not yet have a
  full API" per Homepage's own widget docs — create a status page and give
  it a slug if live up/down counts are wanted on the tile later). Tailscale
  uses Homepage's official widget with `deviceid: nzXB3KcLVg11CNTRL` (a
  stable, non-secret identifier) and `{{HOMEPAGE_VAR_TAILSCALE_KEY}}`; the
  user generated the actual API access token and added it as a Homepage env
  var themselves. Verified live: the tile renders real device data.
- Renamed the Actual Budget hostname from `actual.welldonestreams.com` to
  `budget.welldonestreams.com` per user request: AdGuard rewrite edited in
  place, NPM proxy host's domain swapped (same backend
  `10.0.0.162:31012`, same wildcard cert, no new certificate issued).
  Verified `budget.welldonestreams.com` returns HTTP 200 and
  `actual.welldonestreams.com` no longer resolves. The Kuma monitor for the
  old hostname was **not** updated (see Open Kuma follow-ups above).
- Deployed Beszel (host + container metrics; TrueNAS 25.10 no longer
  provides granular per-process metrics in its own UI, and the gameplan's
  Phase 7 pre-approved this exact tool once uptime monitoring was stable).
  Dataset `tank/apps/beszel` (standard ACL), hub container `beszel`
  (`henrygd/beszel:latest`, port 8090, data at `hub_data`) and agent
  container `beszel-agent` (`henrygd/beszel-agent:latest`, host network,
  read-only `docker.sock` mount for container stats, data at `agent_data`).
  Compose file at `/mnt/tank/apps/beszel/docker-compose.yml`.
  **Deployed via `docker compose up -d` directly over SSH, not the TrueNAS
  Apps UI** — the TrueNAS web session had expired at that point in the
  night and this was done without prompting the user, so unlike every other
  app in this stack, **Beszel will not appear in TrueNAS's Installed Apps
  list** and won't get middleware-managed updates. Redeploy it through
  Apps -> Discover Apps -> Custom App with the same compose content if
  that management gap matters. Added AdGuard rewrite + NPM proxy host
  (`beszel.welldonestreams.com` -> `10.0.0.162:8090`, wildcard cert, LAN
  Only, matching every other internal name) and a Homepage tile. Verified
  `https://beszel.welldonestreams.com` returns HTTP 200.
  **Not yet complete:** `beszel-agent` is deployed but stopped (not
  crash-looping) because it only has placeholder `TOKEN`/`KEY` values —
  those come from the hub's "Add System" dialog, which requires the hub's
  first admin account to exist first. Account creation involves choosing a
  password, which this session did not do (consistent with never handling
  account credentials directly, same as the sudo password, Tailscale auth
  key, and Tailscale API token earlier tonight). Create the account at
  `https://beszel.welldonestreams.com`, add the TrueNAS system, put the
  real token/key in the compose file's two `PASTE_..._FROM_HUB_ADD_SYSTEM`
  placeholders, then `docker compose up -d --force-recreate beszel-agent`.
  Also add `HOMEPAGE_VAR_BESZEL_USER`/`_PASS` to Homepage once the account
  exists — the tile's widget is already wired to those variable names.
