# Homelab completion game plan

Last updated: 2026-07-26 (America/Los_Angeles)

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
  `prowlarr`, `nzbget`, `adguard`, `npm`, `immich`, `mail-archiver`, `budget`,
  `kuma`, and `beszel`, all under `.welldonestreams.com`, proxying to their
  TrueNAS application on `10.0.0.162`. `switch` and `ap` proxy to `10.0.0.168:80` and
  `10.0.0.117:80`. All use a wildcard `*.welldonestreams.com` Let's Encrypt
  certificate (issued via a DNS-edit-scoped Cloudflare token, valid through
  2026-10-23) and the Nginx Proxy Manager `LAN Only` access list; none have
  public Cloudflare DNS records. AdGuard Home holds the matching local
  rewrites. The pre-existing public hosts (Vault, Requests, Renewals) are
  intentionally unchanged.
- Local ZFS snapshots exist. An off-box backup target is still not configured;
  provider selection is deferred to roughly the first week of August 2026.
- Tailscale is deployed as a subnet router (dataset `tank/apps/tailscale`,
  container `truenas-subnet-router`, advertising `10.0.0.0/24`) alongside the
  existing OPNsense WireGuard tunnel. **Live since 2026-07-26:** the
  `10.0.0.0/24` route is approved in the admin console (`PrimaryRoutes`
  populated), split DNS is set, and off-LAN reachability was confirmed by the
  user. See the 2026-07-26 section in `HOMELAB-HANDOFF.md`.
- A UPS is physically installed, but TrueNAS is **not** talking to it —
  `ups.config` has an empty driver and port, so there is no battery
  monitoring and no graceful shutdown on power loss. Connect the UPS data
  cable and configure System Settings -> Services -> UPS to close this.

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

## What to do next, in order

This is the flat punch list. Each item links to its full detail in the phase
below. Everything not listed here in a phase is already done.

### START HERE — morning of 2026-07-27

Written at the end of a long 2026-07-26 session. In priority order:

- [x] **`tank` scrub result — CLEAN.** The pool's first ever scrub finished
  2026-07-27 02:15 PDT: `repaired 0B in 06:01:46 with 0 errors`, all six
  raidz2 members ONLINE with zero read/write/cksum errors. No bit-rot. This
  item is closed; scrubs now run on their existing schedule.
- [ ] **Finish the 1080p orphan cleanup — 8 files left** (measured
  2026-07-27; the earlier "49 remaining" and "all deleted" claims were both
  wrong). Identify them, then delete by hand. **Do not destroy the
  `pre-1080p-standardize-20260726` snapshot until the count reads 0** — it is
  still the rollback for an unfinished purge. `HOMELAB-HANDOFF.md` -> "1080p
  standardization" -> "Orphan cleanup status" is the **single source of
  truth**; do not restate on-disk status in this file.
- [ ] **Let the download queue drain.** ~205 Radarr + ~31 Sonarr items, all
  1080p. Nothing to do but wait; Kometa fires itself afterwards.
- [ ] **Confirm Kometa auto-ran.** After the queues empty, check
  `/mnt/tank/apps/kometa/queue-watcher.log`. If it ran, `.kometa-ran` exists
  and it will not repeat. If the log shows the MyAnimeList errors again,
  configure MAL in `config.yml` or drop those `mal_*` collections.
- [ ] **Off-box backup is now the single biggest remaining risk.** Everything
  done on 2026-07-26 improved *on-box* redundancy only. A fire, theft, or
  total-loss event still loses everything. This was already targeted for
  early August — it is now overdue relative to how much irreplaceable data
  is on the box (Immich photos, Paperless documents, Vaultwarden).
- [ ] **Wire the UPS into TrueNAS.** The UPS itself is installed; TrueNAS
  just isn't reading it (`ups.config` driver/port empty). Connect the USB
  data cable and configure System Settings -> Services -> UPS, then set the
  shutdown threshold. Until then the hardware protects against a brief
  brownout but the box still hard-cuts on a long outage.
- [x] **Verify the formerly reported SNMP Trap alert route.** Live TrueNAS
  review on 2026-07-27 found only the enabled E-Mail alert service; no SNMP
  Trap alert service is currently configured, so there is no dead route to
  disable. Email alerting remains the active delivery path.
- [ ] Optional cleanup: the Kometa app itself is still installed-but-stopped,
  and `/mnt/tank/apps/kometa` holds a 52 MB `config.cache` plus old logs.
  Its Homepage tile is gone but the "Kometa Wiki" bookmark remains.

### Standing punch list

These are the long-lived numbered items. **Other documents cite them by
number** (for example `HOMELAB-HANDOFF.md` refers to "punch-list item 4" and
"punch-list item 9") — renumber them only if you also update those references.

1. ~~**Finish last night's (2026-07-26) unattended work — five quick items:**~~
   **All done 2026-07-26.** For the record:
   - Tailscale `10.0.0.0/24` route approved (`PrimaryRoutes` now populated),
     split DNS set, and off-LAN reachability confirmed by the user.
   - The Kuma monitor is on `budget.welldonestreams.com` (id 19).
   - Beszel was **redeployed through TrueNAS Apps** as `beszel-hub` (port
     30333) and the old raw `docker compose` hub on 8090 was torn down —
     the "consider redeploying" item is therefore settled, not pending. A
     `beszel-agent` container registered against the new hub, NPM's
     `beszel.welldonestreams.com` was repointed to 30333, and Homepage's
     widget credentials are set. See `WORKLOG.md` 2026-07-26.
2. ~~**Check that the TrueNAS test alert email arrived.**~~ **Done** —
   confirmed received. *(Phase 3)*
3. ~~**Resolve the `Platonic` release in Sonarr's queue.**~~ **Done.**
   *(Phase 1)*
4. ~~**Confirm the Elio WEB-DL replacement finished, imported, and plays in
   Plex.**~~ **Confirmed imported 2026-07-26** — Radarr reports `hasFile=true`,
   `Elio.2025.2160p.MA.WEB-DL...H.265-TheFarm.mkv`, 20.5 GB, WEBDL-2160p.
   Plex playback itself still unverified, but the download/import half is
   done. **Consequence:** the
   `tank/data/usenet/complete@codex-pre-elio-regrab-20260725` snapshot was
   only a recovery point for the removed 75 GB disc job, and it is holding
   **90.6 GB**. It can be destroyed now that the replacement imported.
   *(Phase 1)*
5. ~~**Fix Kuma's two ~50%-uptime monitors and add monitor dependencies.**~~
   **Reported done** by the user earlier on 2026-07-26 (monitor dependencies
   configured, both flaky monitors fixed, confirmed via Signal test alerts).
   Not independently re-verified by an agent this session — worth a quick
   look in the Kuma UI to confirm next time someone's logged in. *(Phase 2)*
6. **Decide the off-box backup provider.** Target window is roughly the first
   week of August 2026 — about a week out from this writing — so this is the
   next big decision, not a someday item. Once chosen: enable encryption, run
   the first backup, and test a restore. *(Phase 4)*
7. **Run one real Sonarr and one real Radarr download end to end**, confirm
   NZBGet/Sonarr/Radarr file permissions don't need manual chmod/chown, then
   turn on the Recyclarr schedule — the required preview and manual sync
   already succeeded, so scheduling is the only remaining step. *(Phase 5)*
8. **Replace the 720p CAM copy of The Invite (2026)** when a legitimate
   WEB-DL or better release is available. Not urgent; opportunistic. *(Phase
   1)*
9. **Connect the UPS to TrueNAS.** Confirmed 2026-07-27: a UPS **is**
   physically installed, correcting the earlier "no UPS" claim. What is
   missing is the software half — `ups.config` has an empty driver and port,
   so TrueNAS cannot see battery state and will not shut down gracefully on a
   long outage. Connect the UPS USB data cable, then configure System
   Settings -> Services -> UPS (pick the driver matching the model, usually
   `usbhid-ups`), enable "Shutdown mode", and record the model and shutdown
   threshold here once set. *(Phase 3)*
10. **Next time you're in OPNsense:** confirm DHCP can't hand out a
    DNS server other than the intended one, and schedule the 26.7 upgrade
    maintenance window. **SSH: confirmed disabled by the user 2026-07-27.**
    *(Phase 6)*
11. **Non-homelab, whenever you get to it:** the GPU crash investigation
    (controlled load test with HWiNFO64). Doesn't block the homelab
    baseline. The craps prop-bet UI was built 2026-07-26 (Worker + frontend,
    see `WORKLOG.md`) — smoke-test it in a browser next time you're on the
    casino page, since it wasn't verified live this session. *(see
    "Non-homelab open work" at the bottom)*

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

**Reported resolved by the user on 2026-07-26** (see the punch list above);
the checklist below wasn't updated with which resolution path was taken
(manual-mapped and imported, vs. removed and blocklisted) — confirm the
actual state in Sonarr before assuming either.

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

## Phase 2 — Install Uptime Kuma (deployed 2026-07-25; 3 items remaining)

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
`prowlarr`, `bazarr`, `tautulli`, `immich`, `actual` (hostname renamed to
`budget.welldonestreams.com` on 2026-07-26 — **this monitor was not
updated and needs its target URL fixed**, see item 1 above), `adguard`,
`npm`, `mail-archiver` (all under `.welldonestreams.com`). Beszel is not
yet monitored here.
Infrastructure: Ping `10.0.0.1`, Ping `10.0.0.162`, `tautulli` by raw IP, `npm`
by raw IP.

`plex` and `nzbget` monitors accept HTTP 401 as healthy (both require login).
Duplicate monitors for `home.welldonestreams.com` and `welldonestreams.com`
were removed in cleanup.

### Open items in Phase 2

**User-reported resolved on 2026-07-26** (dependencies configured, both
monitors below fixed), but not independently re-verified by an agent this
session — the three checkboxes weren't updated with which specific fix was
applied to each. Confirm directly in the Kuma UI next time someone's logged
in, then check these off for real.

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
- [x] **Recovery notification test performed.** Stopped and restarted an app
      to force a real DOWN/UP cycle and confirmed both alerts arrived on
      Signal. Down-only alerting is a common one-way failure mode, so this
      matters as much as the initial DOWN alert.
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
- [ ] Review UPS status and shutdown behavior. **A UPS is installed
      (confirmed 2026-07-27)**, but TrueNAS is not integrated with it —
      `ups.config` driver and port are empty, so there is no battery
      monitoring and no graceful shutdown. See punch-list item 9.

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
- [x] Run one successful manual `recyclarr sync` (done: no material profile
      changes were needed).
- [ ] Turn on the Recyclarr schedule. Both preconditions above are met — this
      is the only remaining step.

**Exit condition:** one TV and one movie download complete, unpack, import,
rename, and appear in Plex without manual intervention.

## Phase 6 — Network and access review (20-30 minutes)

- [x] Confirm AdGuard Home still serves LAN DNS and internal rewrites. Verified
      (Codex and Claude, 2026-07-25): all 17 internal hostnames, including
      `actual.welldonestreams.com`, resolve through AdGuard to the LAN proxy.
      Actual Budget was reached over HTTPS after its rewrite was restored.
      **Renamed 2026-07-26:** the Actual Budget hostname is now
      `budget.welldonestreams.com` (AdGuard rewrite and NPM proxy host both
      updated; `actual.welldonestreams.com` intentionally no longer resolves).
- [x] Confirm OPNsense/Unbound forwarding design has no DNS loop with AdGuard.
      Verified live (Codex, 2026-07-25): OPNsense Dnsmasq is bound to LAN port
      5354, while AdGuard forwards to `10.0.0.1:5353`; the services are not
      competing for the same listener.
- [ ] Confirm clients cannot bypass intended DNS using DHCP-provided alternatives,
      except where explicitly allowed. Not verifiable from a LAN client;
      requires OPNsense DHCP config access. **How to check** (OPNsense web UI,
      `https://10.0.0.1`):
      1. *Services -> ISC DHCPv4 -> [LAN]* (or *Services -> Dnsmasq DNS & DHCP
         -> DHCP ranges* on 25.x+). Look at the **DNS servers** field. It
         should list only `10.0.0.162` (AdGuard). If it is blank, clients get
         the firewall's own resolver instead — set it explicitly.
      2. Check there is no second DHCP server on the LAN and no extra DNS
         entry in *System -> Settings -> General*.
      3. Optional hardening: *Firewall -> NAT -> Port Forward*, redirect LAN
         TCP/UDP port 53 to `10.0.0.162` so a device with hardcoded
         `8.8.8.8` is transparently forced back to AdGuard. Note this does
         not catch DNS-over-HTTPS, which needs separate blocking.
- [x] Re-test both LAN-only admin hostnames from a LAN client. Expanded scope:
      re-tested all 17 configured internal hostnames, not just the original
      two. All resolve and respond over HTTPS. `plex` and `nzbget` return HTTP
      401 on their root path, which is expected (both require login) and
      confirms the proxy reaches a live backend rather than failing.
- [x] Confirm those hostnames are not reachable from an external/mobile network.
      Verified (Claude, 2026-07-25): queried a public resolver (1.1.1.1)
      directly for a representative sample — all return NXDOMAIN, confirming
      no public Cloudflare A/AAAA record exists for any of them.
- [x] Keep OPNsense SSH disabled unless a specific maintenance task requires it.
      **Confirmed disabled by the user, 2026-07-27.**
- [ ] Defer the OPNsense 26.7 feature upgrade until a scheduled maintenance
      window with a current configuration export.

## Phase 7 — Optional applications after the core is healthy

Install these only when they solve a defined problem:

### Consider later

- **Scrutiny:** optional disk-health dashboard. TrueNAS SMART tests and alerts
  remain authoritative; install Scrutiny only for better visualization/history,
  not as a replacement.
- ~~**Beszel or Netdata:** optional host/container metrics after uptime
  monitoring is stable. Avoid adding both initially.~~ **Beszel deployed
  2026-07-26** (dataset `tank/apps/beszel`, hub on port 8090, agent on host
  network). Deployed via `docker compose` directly over SSH rather than the
  TrueNAS Apps UI (session had expired), so it is **not** in TrueNAS's
  Installed Apps list — a real gap if you want middleware-managed
  updates/backups for it, worth redeploying through Apps -> Discover Apps ->
  Custom App later if that matters to you. `beszel.welldonestreams.com` is
  live (AdGuard + NPM + wildcard cert, LAN Only) and there's a Homepage
  tile. Still needs a human: create the hub's first admin account, add the
  TrueNAS system to get a real agent token, and add
  `HOMEPAGE_VAR_BESZEL_USER`/`_PASS` to Homepage. See the 2026-07-26 entry
  in `WORKLOG.md` for exact commands.
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

- ~~**Craps prop-bet UI** in `casino.html`. The Worker already supports 2/12
  at 30:1, 3/11 at 15:1, place bets, and field bets; the frontend surface for
  those is not yet built.~~ **Built 2026-07-26.** That "Worker already
  supports it" claim was actually false when checked — only Pass Line
  existed in `welldonestreams-worker`. Added `betType` handling to the
  Worker (merged as PR #2) and the matching bet-type picker in
  `js/games/craps.js`. Not verified in a live browser this session; smoke-
  test each bet type before trusting it fully.
- **PC GPU crash investigation** (Radeon RX 7800 XT). Next step is a
  controlled load/gaming test capturing GPU temperature, power draw, and
  clocks with HWiNFO64, followed by a DDU-clean reinstall of a different
  driver build if that comes back clean.
