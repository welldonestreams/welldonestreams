# Homelab completion game plan

Last updated: 2026-07-25 (America/Los_Angeles)

This is the shared operating plan for the remaining TrueNAS, networking, media,
monitoring, and backup work. It is written for the user, Codex, and Claude. Keep
it free of passwords, API keys, cookies, tokens, phone numbers, and certificate
secrets — both `welldonestreams` and `welldonestreams-worker` are public.

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
- Monitoring stack: Uptime Kuma at `kuma.welldonestreams.com` (LAN-only via
  NPM), plus a free UptimeRobot external watcher for `welldonestreams.com` and
  `requests.welldonestreams.com`.
- Notification path: Signal (webhook to a local `signal-cli-rest-api`
  container on `10.0.0.162:9922`) is the primary channel. Gmail SMTP is the
  secondary channel, sharing the same WAN dependency as everything else. The
  T-Mobile email-to-SMS gateway was attempted and abandoned; carrier-gateway
  SMS is not currently a working alert path.
- Trusted local HTTPS names cover the full internal stack: `truenas`,
  `opnsense`, `home`, `plex`, `tautulli`, `sonarr`, `radarr`, `bazarr`,
  `prowlarr`, `nzbget`, `adguard`, `npm`, `immich`, `mail-archiver`, `actual`,
  and `kuma`, all under `.welldonestreams.com`, proxying to their TrueNAS
  application on `10.0.0.162`. `switch` and `ap` proxy to `10.0.0.168:80` and
  `10.0.0.117:80`. All use a wildcard `*.welldonestreams.com` Let's Encrypt
  certificate (issued via a DNS-edit-scoped Cloudflare token, valid through
  2026-10-23) and the Nginx Proxy Manager `LAN Only` access list; none have
  public Cloudflare DNS records. AdGuard Home holds the matching local
  rewrites. The pre-existing public hosts (Vault, Requests, Renewals) are
  intentionally unchanged.
- Local ZFS snapshots exist. An off-box backup target is still not configured;
  provider selection is deferred to roughly the first week of August 2026.

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
   newest-first `WORKLOG.md` entry, staged with the change it describes.

# Prioritized plan

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
there is enough free space for download unpacking and media imports. **Met.**

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

## Phase 2 — Install Uptime Kuma (largely complete 2026-07-25)

Uptime Kuma is the next recommended application because local services can fail
silently even when Homepage still renders. Do not finish deployment without a
working notification channel.

**Known structural limitation.** Kuma runs on `10.0.0.162`, the same host as
almost everything it monitors, and it resolves internal names through AdGuard,
which is also on `10.0.0.162`. It therefore cannot alert on a NAS outage, a DNS
failure, or a WAN outage — the three failures that matter most. The external
UptimeRobot watcher below is what covers that gap; it is not optional.

Signal is the only alert channel that does not share a WAN/Gmail dependency:
the `signal-cli-rest-api` container runs locally, so Kuma → Signal delivery
works as long as the LAN and the recipient's phone both have connectivity
independent of the home WAN.

### Notification channels

- [x] **Signal** (primary, WAN-independent): `bbernhard/signal-cli-rest-api`
      container on `10.0.0.162:9922` in `MODE=normal`, storage
      `/mnt/tank/apps/signal-api`, linked as a secondary device
      `kuma-alerts` to the user's Signal account. Kuma sends via Webhook to
      `http://10.0.0.162:9922/v2/send` with a DOWN/UP/OTHER template. The
      registered phone number lives only in Kuma's notification config and the
      linked-device list — **never write it into this repo.**
- [x] **Email** (secondary, WAN-dependent): Gmail SMTP, reusing the same
      account already used for TrueNAS alerts. Address kept in Kuma's own
      config, not in this repo.
- [-] **SMS via T-Mobile email-to-SMS gateway** (attempted, abandoned):
      couldn't get it working reliably. Not counted as an available channel.
      If SMS is later required, use a paid SMS API (Twilio/ClickSend) rather
      than a carrier gateway.

### Deployment

- [x] Dataset `tank/apps/uptime-kuma` created with the standard ACL: both
      `User-truenas_admin` and `Group-apps` (GID 568), Allow / Full Control,
      File + Directory Inherit, bogus `User-apps` entry deleted.
- [x] Kuma config/data volume pointed at `/mnt/tank/apps/uptime-kuma` (host
      path, not an ixVolume) so it is covered by the hourly `tank/apps`
      snapshot schedule.

### Proxy and DNS

- [x] NPM proxy host `kuma.welldonestreams.com` → container port on
      `10.0.0.162`, wildcard cert, Force SSL, HTTP/2, `LAN Only` access list.
- [x] AdGuard Home local DNS rewrite: `kuma.welldonestreams.com` →
      `10.0.0.162`. No public Cloudflare record.

### Smoke test

- [x] Hostname monitor `https://home.welldonestreams.com` returned green,
      confirming the Kuma container's DNS resolves internal names correctly.

### External watcher

- [x] UptimeRobot free tier deployed, monitoring `welldonestreams.com` and
      `requests.welldonestreams.com` from off-site. Alerts point at the same
      email address as Kuma.
- [x] Confirmed the external watcher fires independently — this is the only
      alert path that survives a NAS, DNS, or WAN outage.

### Active monitors (24 total, verified 2026-07-25)

Public: `welldonestreams.com`, `welldonestreams.com/api/poll`, `vault`,
`requests`, `renewals`.
Internal: `truenas`, `opnsense`, `home`, `plex`, `nzbget`, `sonarr`, `radarr`,
`prowlarr`, `bazarr`, `tautulli`, `immich`, `actual`, `adguard`, `npm`,
`mail-archiver` (all under `.welldonestreams.com`).
Infrastructure: Ping `10.0.0.1`, Ping `10.0.0.162`, `tautulli` by raw IP, `npm`
by raw IP.

`plex` and `nzbget` monitors accept HTTP 401 as healthy (both require login).
Duplicate monitors for `home.welldonestreams.com` and `welldonestreams.com`
were removed in cleanup.

### Open items in Phase 2

- [ ] **Monitor dependencies not yet configured.** Set the `10.0.0.162` ping
      monitor as the parent of every hostname monitor hosted on `10.0.0.162`,
      so a NAS outage sends one alert instead of ~20.
- [ ] **`home.welldonestreams.com` DNS-type monitor at ~50% uptime.** Kuma's
      DNS monitor type does raw queries the Docker resolver (`127.0.0.11`)
      doesn't support consistently. Either delete this monitor (the hostname
      monitor already exercises DNS) or rebuild it to query AdGuard directly.
- [ ] **`tautulli` raw-IP monitor at ~50% uptime.** Tautulli serves plain HTTP,
      not HTTPS; confirm the monitor URL is `http://10.0.0.162:30047/` and
      that Kuma isn't following a redirect it can't validate.
- [ ] **Recovery notification test not yet performed.** Point one monitor at a
      closed port to force DOWN, then restore it, and confirm both the DOWN
      and UP alerts arrive on Signal. Down-only alerting is a common one-way
      failure mode.
- [x] Certificate-expiry notification enabled on the HTTPS monitors. Wildcard
      expires **2026-10-23**; NPM auto-renews via the Cloudflare DNS
      challenge, but Kuma will now surface a silent renewal failure before it
      breaks all 17 internal names at once.

**Exit condition:** Kuma has raised one real DOWN and one recovery
notification, monitor dependencies suppress storms, the two 50% monitors are
either fixed or removed, and the external watcher has independently fired at
least once.

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

**Status (user, 2026-07-25): not deciding yet.** Provider selection is
targeted for roughly the first week of August 2026. Do not start a paid or
large upload before then. Re-ask rather than assuming a default once that's
arrived.

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

**Exit condition:** one TV and one movie download complete, unpack, import,
rename, and appear in Plex without manual intervention.

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
      two. All resolve and respond over HTTPS. `plex` and `nzbget` return HTTP
      401 on their root path, which is expected (both require login) and
      confirms the proxy reaches a live backend rather than failing.
- [x] Confirm those hostnames are not reachable from an external/mobile network.
      Verified (Claude, 2026-07-25): queried a public resolver (1.1.1.1)
      directly for a representative sample — all return NXDOMAIN, confirming
      no public Cloudflare A/AAAA record exists for any of them.
- [ ] Keep OPNsense SSH disabled unless a specific maintenance task requires it.
      Not independently re-verified this session; relies on prior documented
      state.
- [ ] Defer the OPNsense 26.7 feature upgrade until a scheduled maintenance
      window with a current configuration export.

## Phase 7 — Optional applications after the core is healthy

Install these only when they solve a defined problem:

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

# Definition of done for the homelab baseline

The baseline is complete when all of the following are true:

- Pools are healthy and TrueNAS alerts are delivered externally.
- Snapshots, scrubs, and SMART tests are scheduled and verified.
- Uptime Kuma detects failures and successfully sends notifications, with
  monitor dependencies suppressing alert storms and a recovery notification
  confirmed on Signal.
- The external UptimeRobot watcher has fired independently.
- Sonarr/Radarr/NZBGet complete normal downloads and imports automatically.
- NZBGet's `/downloads` path is translated consistently to Sonarr/Radarr's
  `/data/usenet` path.
- Admin interfaces remain LAN-only and use trusted HTTPS names.
- An encrypted off-box backup exists and a restore has been tested.
- The OPNsense upgrade is either completed in a planned window or explicitly
  deferred with a current backup.
- `HOMELAB-HANDOFF.md` reflects the verified state and remaining exceptions.

# Non-homelab open work (tracked here so it doesn't evaporate)

- **Craps prop-bet UI** in `casino.html`. The Worker already supports 2/12 at
  30:1, 3/11 at 15:1, place bets, and field bets; the frontend surface for
  those is not yet built. Also the craps "More Info" dropdown work.
- **PC GPU crash investigation** (Radeon RX 7800 XT). Next step is a
  controlled load/gaming test capturing GPU temperature, power draw, and
  clocks with HWiNFO64, followed by a DDU-clean reinstall of a different
  driver build if that comes back clean.
