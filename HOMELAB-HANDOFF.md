# Homelab handoff

Last verified: 2026-07-25 (America/Los_Angeles)

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
- The current internal TLS certificate is a two-name Cloudflare-DNS-validated
  certificate for the TrueNAS and OPNsense hostnames. A separate certificate
  covering the planned local service names (preferably a wildcard, if the
  existing Cloudflare credential permits it) is required before the remaining
  HTTPS proxy hosts can be added.

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
- TrueNAS 25.10 no longer provides the old SMART scheduling screen. All six
  HDDs and both NVMe devices currently pass SMART health. Added supported cron
  tasks for short tests every Wednesday at 01:00 and long tests monthly on the
  8th at 01:00; both skip execution while a scrub or resilver is active.
- TrueNAS has enabled SNMP and email alert services. A live email alert-service
  test was accepted by middleware; receipt still needs user confirmation.
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

## Completed maintenance

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
- **Gap found:** `actual.welldonestreams.com` returns NXDOMAIN even though the
  `e53db04` rollout commit lists it as one of the AdGuard rewrites created.
  Every other name from that same list resolves fine, so this looks like a
  single missed entry rather than a systemic problem. Add the missing AdGuard
  Home local DNS rewrite for `actual` (same pattern as the other names, to
  `10.0.0.162`).
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
- The best next application is Uptime Kuma. Add it after choosing a notification
  target, then monitor public services, both trusted admin names, DNS, the media
  applications, and the Renewals endpoint. Do not consider it complete until a
  real failure and recovery notification are delivered.
- Kometa remains intentionally stopped and was not the source of the Renewals
  startup failure.
