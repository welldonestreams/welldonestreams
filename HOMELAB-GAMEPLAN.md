# Homelab completion game plan

Last updated: 2026-07-25 (America/Los_Angeles)

This is the shared operating plan for the remaining TrueNAS, networking, media,
monitoring, and backup work. It is written for the user, Codex, and Claude. Keep
it free of passwords, API keys, cookies, tokens, and certificate secrets.

## Current known environment

- TrueNAS SCALE host: `10.0.0.162`.
- Primary pool/dataset root: `/mnt/tank`.
- Application data commonly lives under `/mnt/tank/apps`.
- Usenet data lives at host path `/mnt/tank/data/usenet`. NZBGet maps it as
  `/downloads`; Sonarr and Radarr map `/mnt/tank/data` as `/data` and translate
  `/downloads/` to `/data/usenet/` with explicit remote-path mappings.
- Download client: NZBGet. Do not assume qBittorrent or torrent paths.
- Media stack includes Plex, Sonarr, Radarr, Prowlarr, NZBGet, and Recyclarr.
- Recyclarr runs with Docker and stores configuration under
  `/mnt/tank/apps/recyclarr`.
- Network stack includes OPNsense, AdGuard Home, Nginx Proxy Manager, and
  Homepage.
- Trusted local HTTPS names now cover the full internal stack, not just
  TrueNAS/OPNsense: `truenas`, `opnsense`, `home`, `plex`, `tautulli`,
  `sonarr`, `radarr`, `bazarr`, `prowlarr`, `nzbget`, `adguard`, `npm`,
  `immich`, `mail-archiver`, and `actual`, all under `.welldonestreams.com`,
  proxying to their TrueNAS application on `10.0.0.162`. `switch` and `ap`
  proxy to `10.0.0.168:80` and `10.0.0.117:80`. All use a wildcard
  `*.welldonestreams.com` Let's Encrypt certificate (issued via a
  DNS-edit-scoped Cloudflare token, valid through 2026-10-23) and the Nginx
  Proxy Manager `LAN Only` access list; none have public Cloudflare DNS
  records. AdGuard Home holds the matching local rewrites. The pre-existing
  public hosts (Vault, Requests, Renewals) were intentionally left unchanged.
- Homepage, Renewals, Nginx Proxy Manager, and AdGuard Home were last verified
  running on 2026-07-25 (Claude, from a LAN client using AdGuard DNS):
  `https://home.welldonestreams.com` and `https://switch.welldonestreams.com`
  both resolve and return a real HTTP 200 render, not an error page. This
  supersedes the two open items recorded earlier in `HOMELAB-HANDOFF.md` (the
  Homepage `HOMEPAGE_ALLOWED_HOSTS` update possibly not saving, and `switch`
  not resolving) — both now work from this vantage point. Worth a second
  confirmation from the device that originally reported the `switch` failure,
  in case that device's issue was local DNS configuration rather than the
  proxy itself.
- Local ZFS snapshots exist, but an off-box backup target has not yet been
  configured.

## Rules for both agents

1. Read `AGENTS.md`, `HOMELAB-HANDOFF.md`, this file, and the newest entries in
   `WORKLOG.md` before changing the homelab.
2. Treat the paths above as authoritative unless the live TrueNAS configuration
   proves otherwise. Never invent `/downloads`, `/mnt/tank/downloads`, or a
   qBittorrent deployment.
3. Preserve working services and unrelated user changes. Take a recursive ZFS
   snapshot before high-impact storage, permissions, application, or proxy work.
4. Never expose an admin service publicly. TrueNAS and OPNsense must remain
   LAN-only unless the user explicitly approves a secure remote-access design.
5. Do not install Unpackerr as the first response to an archived Usenet job.
   NZBGet supports unpacking; inspect NZBGet configuration and the job log first.
6. Do not perform the OPNsense 26.7 feature upgrade unattended. Export a current
   OPNsense configuration and schedule a maintenance window first.
7. Record important verified changes in `HOMELAB-HANDOFF.md` and add a concise,
   newest-first `WORKLOG.md` entry.

# Tonight's prioritized plan

Work top to bottom. Stop after any step that reveals a storage, pool, permission,
or networking fault and resolve that fault before installing more applications.

## Phase 0 — Capture a baseline (15 minutes)

- [x] Open TrueNAS and verify `apps`, `boot-pool`, and `tank` are ONLINE.
- [x] Check the TrueNAS alerts panel for active storage, application, UPS, or
      certificate warnings.
- [x] Confirm at least 15-20% free space remains on datasets used by NZBGet and
      media imports.
- [x] Confirm Homepage, Plex, Sonarr, Radarr, Prowlarr, NZBGet, AdGuard Home,
      Nginx Proxy Manager, and Renewals are reachable.
- [x] Exported a fresh OPNsense configuration backup and stored it outside the
      firewall appliance in the private local homelab-backups folder.
- [x] Create a new recursive pre-work snapshot of `tank/apps` if any application
      configuration will be changed tonight.

**Exit condition:** pools are healthy, no unexplained critical alerts exist, and
there is enough free space for download unpacking and media imports.

## Phase 1 — Fix the current Sonarr/Radarr queue problems (20-40 minutes)

### Platonic in Sonarr

The release name contains `Platonic.2025...NF...`, while the expected series is
`Platonic (2023)` and the known show is associated with Apple TV+, not Netflix.
Treat this as suspicious even though episode titles may look plausible.

- [ ] Open Sonarr > Activity > Queue > Manual Import for the affected release.
- [ ] Inspect the actual video file, runtime, episode title, and content.
- [ ] If it is definitely the correct episode, manually map it to the correct
      series/season/episode and import with Move.
- [ ] If the content or season is wrong, remove it, blocklist the release, and
      search for a correctly named release.
- [ ] Do not force-import based only on the grab-history ID.

### The Invite (2026) in Radarr

- [x] Verified the intended title is **The Invite (2026)**, TMDb 950028, not
      *The Invitation*. Radarr monitors the correct movie and currently has an
      imported file named `the.invite.2026.720p.CAM.h264-jff.mkv`.
- [ ] Replace or upgrade the current 720p CAM copy when a legitimate WEB-DL or
      higher-quality release is available. Do not delete it solely because older
      notes referred to the wrong title.

### Elio archive warning

- [x] Open NZBGet > Settings > Unpack and confirm `Unpack` is enabled.
- [x] Open NZBGet > History, select the Elio job, and read the full log.
- [x] Look specifically for password protection, missing RAR volumes, failed
      PAR2 repair, unpack errors, permissions, or insufficient free space.
- [x] Confirmed the completed item was a full-disc Blu-ray BDMV ZIP rather than
      a failed archive. Created a recursive Usenet safety snapshot, removed and
      blocklisted the disc release, and grabbed a normal 2160p WEB-DL instead.
- [ ] Confirm the new WEB-DL completes, imports automatically, and plays in Plex.
- [ ] Install Unpackerr only if a recurring, verified archive workflow remains
      that NZBGet cannot handle natively.

**Exit condition:** the queue contains no unexplained yellow import warnings and
NZBGet can unpack a normal completed test job into `/data/usenet`.

## Phase 2 — Install Uptime Kuma (30-60 minutes)

Uptime Kuma is the next recommended application because local services can fail
silently even when Homepage still renders. Do not finish deployment without a
working notification channel.

### Before installation

- [x] Alert destination decided (user, 2026-07-25): two channels, both
      configured directly in Kuma's own notification settings, not stored in
      this repo. (1) Email via SMTP, reusing the user's already-configured
      Gmail address (same one used for TrueNAS alerts). (2) SMS via
      T-Mobile's free email-to-SMS gateway (`<number>@tmomail.net`) — the
      user's phone number goes only into that one Kuma notification field,
      never into a committed file, since this repo is public. Carrier
      gateways can be blocked/flaky; if T-Mobile's gateway proves unreliable
      after testing, fall back to a paid SMS API (Twilio/ClickSend).
- [ ] Decide whether Kuma is LAN-only. Default: LAN-only through Nginx Proxy
      Manager; no public exposure is required.
- [ ] Create persistent storage under a dedicated dataset such as
      `/mnt/tank/apps/uptime-kuma` using the ownership required by the selected
      TrueNAS application/container method.

### Initial monitors

Create monitors in this order:

- [ ] `https://welldonestreams.com` — HTTPS and expected keyword.
- [ ] Cloudflare Worker API endpoint used by the site — HTTPS status/JSON check
      without embedding a secret in the monitor.
- [ ] `https://truenas.welldonestreams.com` — HTTPS, reachable from LAN.
- [ ] `https://opnsense.welldonestreams.com` — HTTPS, reachable from LAN.
- [ ] Homepage.
- [ ] Plex web endpoint.
- [ ] Sonarr HTTP endpoint.
- [ ] Radarr HTTP endpoint.
- [ ] Prowlarr HTTP endpoint.
- [ ] NZBGet HTTP endpoint.
- [ ] AdGuard Home HTTP endpoint.
- [ ] Renewals on its current endpoint/port.
- [ ] DNS record or DNS query monitor for an internal rewrite.
- [ ] Ping monitor for `10.0.0.162`.

Use 60-second intervals for critical public endpoints and 2-5 minute intervals
for internal applications. Require two or three consecutive failures before
alerting to reduce false alarms during application restarts.

### Validation

- [ ] Send a test notification.
- [ ] Temporarily point one test monitor at a closed port and confirm an alert is
      delivered and later resolves.
- [ ] Add the Kuma widget/link to Homepage only after alerts work.
- [ ] Back up Kuma's persistent data through local snapshots and the future
      off-box backup task.

**Exit condition:** at least one real alert and one recovery notification have
been received.

## Phase 3 — Verify TrueNAS data-protection basics (30-45 minutes)

Local snapshots are already configured. Verify the remaining layers:

- [x] Confirm the four periodic snapshot tasks are enabled and have recent
      successful snapshots.
- [x] Confirm pool scrub schedules exist and do not overlap long SMART tests.
- [x] Confirm automatic TrueNAS 25.10 drive-health polling is active and all
      directly attached disks currently pass SMART health.
- [x] Schedule short SMART tests regularly and long tests during low usage,
      avoiding scrub/resilver windows.
- [x] Configure TrueNAS alert delivery to a destination the user actually reads.
      Email delivery now targets the user's requested Gmail address and a fresh
      live send-side test completed; user receipt confirmation remains part of
      the exit condition.
- [ ] Review UPS status and shutdown behavior if a UPS is connected; otherwise
      record UPS coverage as an open infrastructure task.

**Exit condition:** snapshots, scrubs, SMART tests, and alert delivery are all
scheduled and their most recent results are visible.

## Phase 4 — Configure off-box backup (decision first, implementation second)

Snapshots on the same server do not protect against theft, fire, catastrophic
pool loss, or server-wide compromise.

**Status (user, 2026-07-25): not deciding yet.** The user expects to choose a
provider around the first week of August 2026 (said "next week" relative to
this date). Do not start a paid or large upload before then. Re-ask rather
than assuming a default once that's arrived.

### What to back up first

Prioritize irreplaceable and configuration data, not replaceable media:

1. `tank/apps` configuration and databases.
2. `tank/photos` and personal documents.
3. `tank/backups` and exported OPNsense/TrueNAS configuration copies.
4. Website source repositories are already in GitHub, but ensure secrets remain
   outside Git and backed up through their platform/provider.
5. Large Plex media can remain excluded initially unless budget permits.

### Choose one target

- [ ] Backblaze B2 through TrueNAS Cloud Sync.
- [ ] Storj/TrueCloud through TrueNAS backup tasks.
- [ ] Another physically separate TrueNAS or ZFS host using replication.
- [ ] SFTP/SSH target at another trusted location.

### Required controls

- [ ] Enable client-side encryption where supported and store the recovery key
      outside the TrueNAS server.
- [ ] Use a PUSH/COPY-style backup strategy appropriate to the provider; do not
      assume that a bidirectional sync is a safe backup.
- [ ] Configure retention/versioning at the destination.
- [ ] Run the first backup manually and inspect logs.
- [ ] Perform a test restore of several files into a temporary dataset.
- [ ] Record cost, retention, restore process, and encryption-key location in a
      private password manager or offline document, not in GitHub.

**Exit condition:** a successful encrypted off-box backup and a verified restore.

## Phase 5 — Media automation validation (20-30 minutes)

- [x] Confirm NZBGet's `/downloads` path and Sonarr/Radarr's `/data/usenet` path
      are connected by matching remote-path mappings to the same host dataset.
- [x] Confirm completed download handling is enabled in Sonarr and Radarr.
- [x] Verify category names in NZBGet match the download-client definitions in
      Sonarr and Radarr.
- [ ] Verify permissions allow NZBGet to write and Sonarr/Radarr to move without
      recursive chmod/chown jobs.
- [ ] Run one small test episode and one small test movie end to end.
- [ ] Confirm Plex sees the imported files after library scanning.
- [x] Run `recyclarr sync --preview` before any real Recyclarr sync.
- [x] Confirm only the intended Sonarr/Radarr instances and profiles are changed.
- [ ] Schedule Recyclarr only after a clean preview and one successful manual
      sync.

**Exit condition:** one TV and one movie download complete, unpack, import, rename,
and appear in Plex without manual intervention.

## Phase 6 — Network and access review (20-30 minutes)

- [x] Confirm AdGuard Home still serves LAN DNS and internal rewrites. Verified
      (Codex and Claude, 2026-07-25): all 17 internal hostnames, including
      `actual.welldonestreams.com`, resolve through AdGuard to the LAN proxy.
      Actual Budget was reached over HTTPS after its rewrite was restored.
- [x] Confirm OPNsense/Unbound forwarding design has no DNS loop with AdGuard.
      Verified live (Codex, 2026-07-25): OPNsense Dnsmasq is bound to LAN port
      5354, while AdGuard forwards to `10.0.0.1:5353`; the services are not
      competing for the same listener.
- [ ] Confirm clients cannot bypass intended DNS using DHCP-provided alternatives,
      except where explicitly allowed. Not verifiable from a LAN client;
      requires OPNsense DHCP config access.
- [x] Re-test both LAN-only admin hostnames from a LAN client. Expanded scope:
      re-tested all 17 configured internal hostnames, not just the original
      two. All resolve and respond over HTTPS except `actual` (see above).
      `plex` and `nzbget` return HTTP 401 on their root path, which is
      expected (both require login) and confirms the proxy reaches a live
      backend rather than failing.
- [x] Confirm those hostnames are not reachable from an external/mobile network.
      Verified (Claude, 2026-07-25): queried a public resolver (1.1.1.1)
      directly for a representative sample (`truenas`, `home`, `plex`,
      `sonarr`, `switch`, `actual`) — all return NXDOMAIN, confirming no
      public Cloudflare A/AAAA record exists for any of them.
- [ ] Keep OPNsense SSH disabled unless a specific maintenance task requires it.
      Not independently re-verified this session; relies on prior documented
      state.
- [ ] Defer the OPNsense 26.7 feature upgrade until a scheduled maintenance
      window with a current configuration export.

## Phase 7 — Optional applications after the core is healthy

Install these only when they solve a defined problem:

### Recommended next

- **Uptime Kuma:** first priority; service availability and alerting.
- **A notification endpoint:** use an existing Discord/Telegram/Pushover/SMTP
  destination. Deploy `ntfy` or Gotify only if the user wants a self-hosted push
  service and understands that it becomes another service to monitor.

### Consider later

- **Tailscale:** simple authenticated remote access without publicly exposing
  admin pages. Decide whether to run it on OPNsense, a small VM, or another
  always-on host; do not weaken the existing LAN-only proxy restrictions.
- **Scrutiny:** optional disk-health dashboard. TrueNAS SMART tests and alerts
  remain authoritative; install Scrutiny only for better visualization/history,
  not as a replacement.
- **Beszel or Netdata:** optional host/container metrics after uptime monitoring
  is stable. Avoid adding both initially.
- **Watchtower/automatic container updaters:** not recommended for unattended
  production updates. Prefer controlled TrueNAS application updates with a
  snapshot and rollback plan.
- **Unpackerr:** not currently recommended because NZBGet handles Usenet unpacking.
- **Kometa:** keep stopped until the core stack is stable and there is a specific
  metadata/collection goal.
- **Hermes Agent/local AI tooling:** separate project; deploy only in an isolated
  VM/container with minimum permissions after backups and monitoring are done.

# Suggested schedule for tonight

## First hour

1. Baseline health and snapshots.
2. Diagnose NZBGet unpacking.
3. Clear the Sonarr/Radarr queue safely.

## Second hour

1. Install Uptime Kuma.
2. Configure the alert destination.
3. Add critical monitors and test failure/recovery notifications.

## Third hour

1. Verify SMART tests, scrubs, and TrueNAS alert delivery.
2. Confirm consistent `/data/usenet` mounts and run an end-to-end media test.
3. Choose the off-box backup provider and document the decision.

Do not rush the off-box backup setup late at night. It is better to choose the
provider and prepare the dataset list tonight, then perform the first large upload
and restore test during a monitored window.

# Definition of done for the homelab baseline

The baseline is complete when all of the following are true:

- Pools are healthy and TrueNAS alerts are delivered externally.
- Snapshots, scrubs, and SMART tests are scheduled and verified.
- Uptime Kuma detects failures and successfully sends notifications.
- Sonarr/Radarr/NZBGet complete normal downloads and imports automatically.
- NZBGet's `/downloads` path is translated consistently to Sonarr/Radarr's
  `/data/usenet` path.
- Admin interfaces remain LAN-only and use trusted HTTPS names.
- An encrypted off-box backup exists and a restore has been tested.
- The OPNsense upgrade is either completed in a planned window or explicitly
  deferred with a current backup.
- `HOMELAB-HANDOFF.md` reflects the verified state and remaining exceptions.
