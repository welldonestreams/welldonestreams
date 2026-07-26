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

## What to do next, in order

This is the flat punch list. Each item links to its full detail in the phase
below. Everything not listed here in a phase is already done.

1. **Check that the TrueNAS test alert email arrived** (check Spam/Promotions
   too). Two-minute check; closes out Phase 3. *(Phase 3)* (admin: it did)
2. **Resolve the `Platonic` release in Sonarr's queue** via Manual Import —
   verify the actual episode content before importing or blocklisting.
   *(Phase 1)* (admin: it did)
3. **Confirm the Elio WEB-DL replacement finished, imported, and plays in
   Plex.** *(Phase 1)*
4. **Fix Kuma's two ~50%-uptime monitors and add monitor dependencies:**
   delete or rebuild the `home.welldonestreams.com` DNS-type monitor, fix the
   `tautulli` raw-IP monitor's URL/redirect handling, and set the
   `10.0.0.162` ping monitor as the parent of every hostname monitor on that
   host so one outage doesn't fire ~20 alerts. *(Phase 2)* (admin: it did)
5. **Decide the off-box backup provider.** Target window is roughly the first
   week of August 2026 — about a week out from this writing — so this is the
   next big decision, not a someday item. Once chosen: enable encryption, run
   the first backup, and test a restore. *(Phase 4)* (admin: undecided)
6. **Run one real Sonarr and one real Radarr download end to end**, confirm
   NZBGet/Sonarr/Radarr file permissions don't need manual chmod/chown, then
   turn on the Recyclarr schedule — the required preview and manual sync
   already succeeded, so scheduling is the only remaining step. *(Phase 5)*
7. **Replace the 720p CAM copy of The Invite (2026)** when a legitimate
   WEB-DL or better release is available. Not urgent; opportunistic. *(Phase
   1)*
8. **Record UPS status and shutdown behavior**, or record explicitly that no
   UPS is connected. *(Phase 3)*
9. **Next time you're in OPNsense:** confirm DHCP can't hand out a
   DNS server other than the intended one, confirm SSH is still disabled, and
   schedule the 26.7 upgrade maintenance window. *(Phase 6)*
10. **Non-homelab, whenever you get to it:** the craps prop-bet UI in
    `casino.html`, and the GPU crash investigation (controlled load test with
    HWiNFO64). Neither blocks the homelab baseline. *(see "Non-homelab open
    work" at the bottom)*

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


admin entry
# Tailscale deployment brief

**For:** Claude Code, executing against the Well Done Streams homelab.
**Objective:** Deploy Tailscale as a subnet router on TrueNAS so any
authenticated device can reach the `10.0.0.0/24` LAN and resolve internal
`*.welldonestreams.com` names, without opening any new WAN ports and without
weakening the existing `LAN Only` NPM access list.

## Environment you're working in

- TrueNAS SCALE 25.10 at `10.0.0.162` (Docker-based apps).
- OPNsense at `10.0.0.1` — do not touch it in this task.
- Flat LAN `10.0.0.0/24`, DHCP pool `10.0.0.100-199`.
- AdGuard Home on `10.0.0.162:53` holds all internal hostname rewrites for
  `*.welldonestreams.com` → `10.0.0.162`.
- Nginx Proxy Manager fronts every internal service with a `LAN Only` access
  list (10.0.0.0/24 + docker networks) and the wildcard
  `*.welldonestreams.com` Let's Encrypt cert.
- Standard TrueNAS app ACL pattern: `Group-apps` (GID 568) + `User-truenas_admin`,
  Allow / Full Control, File+Directory Inherit; delete the bogus `User-apps`
  entry the Apps preset auto-creates. Use `nfs4xdr_setfacl` and verify with
  `nfs4xdr_getfacl` (plain `getfacl` misleadingly shows POSIX only).
- An existing OPNsense WireGuard tunnel exists (`10.10.10.0/24`,
  `vpn.welldonestreams.com`). Leave it alone.

## Design decisions (already made — do not deviate)

- **Where it runs:** TrueNAS as a custom Docker Compose app in host network
  mode with `NET_ADMIN` + `NET_RAW`. Not the community `os-tailscale`
  OPNsense plugin — that packaging fragility already burned AdGuard once
  during the July 15 opnsense-bootstrap incident.
- **What it advertises:** `10.0.0.0/24`. No exit node yet.
- **DNS design:** MagicDNS on for tailnet names. Split DNS entry for
  `welldonestreams.com` → `10.0.0.162` so all internal hostnames resolve
  correctly for remote clients. Public hosts (`vault`, `requests`,
  `renewals`) still resolve publicly via Cloudflare when off-Tailscale.
- **NPM `LAN Only` list is untouched.** Subnet-routed traffic arrives at
  internal services from source IP `10.0.0.162` (the subnet router itself),
  which is already inside the allowlist. No NPM change needed.

## Prerequisites the human has already done before invoking you

1. Signed up at tailscale.com with the same Gmail as TrueNAS alerts.
2. Generated an auth key at Admin → Settings → Keys → Generate auth key:
   Reusable=on, Ephemeral=off, Pre-authorized=on, Tags=empty,
   Description=`truenas subnet router`. The `tskey-auth-…` value will be
   supplied to you when you need it. **Never commit it to git.**
3. Confirmed SSH is enabled on TrueNAS and `ssh truenas_admin@10.0.0.162`
   works from the Windows PC you're running on.

If any of those aren't true when you start, stop and tell the user.

## Steps

### 1. Pre-work snapshot

```
ssh truenas_admin@10.0.0.162 "sudo zfs snapshot -r apps@pre-tailscale-$(date +%Y%m%d)"
ssh truenas_admin@10.0.0.162 "sudo zfs list -t snapshot | grep pre-tailscale"
```

Verify the snapshot appears before continuing. This is the rollback point.

### 2. Create the dataset

```
ssh truenas_admin@10.0.0.162 "sudo zfs create tank/apps/tailscale"
ssh truenas_admin@10.0.0.162 "sudo mkdir -p /mnt/tank/apps/tailscale/state"
```

Apply the standard apps ACL. Do this via `nfs4xdr_setfacl` since the GUI
preset does not reliably stick on new datasets (see the `tank/backups`
precedent in `HOMELAB-HANDOFF.md`).

```
ssh truenas_admin@10.0.0.162 \
  "sudo nfs4xdr_setfacl -R -m \
     'user:truenas_admin:rwxpDdaARWcCos:fd:allow, \
      group:apps:rwxpDdaARWcCos:fd:allow' \
     /mnt/tank/apps/tailscale"
ssh truenas_admin@10.0.0.162 "sudo nfs4xdr_getfacl /mnt/tank/apps/tailscale"
```

Confirm both entries show with the `fd` inherit flag.

### 3. Verify IPv4 forwarding is on

```
ssh truenas_admin@10.0.0.162 "sysctl net.ipv4.ip_forward"
```

Expected: `net.ipv4.ip_forward = 1`. If it's `0`:

```
ssh truenas_admin@10.0.0.162 \
  "echo 'net.ipv4.ip_forward = 1' | sudo tee /etc/sysctl.d/99-tailscale.conf && \
   sudo sysctl --system"
```

### 4. Deploy the Tailscale container as a TrueNAS custom app

Ask the user for the `tskey-auth-…` value at this point. Do not proceed
without it, and do not write it into any file that will be committed.

Create the compose YAML in the TrueNAS UI: Apps → Discover Apps → Custom App
→ paste this, substituting `TSKEY_HERE`:

```yaml
services:
  tailscale:
    image: tailscale/tailscale:stable
    container_name: tailscale
    hostname: truenas-subnet-router
    network_mode: host
    cap_add:
      - NET_ADMIN
      - NET_RAW
    environment:
      - TS_AUTHKEY=TSKEY_HERE
      - TS_EXTRA_ARGS=--advertise-routes=10.0.0.0/24 --accept-dns=false
      - TS_STATE_DIR=/var/lib/tailscale
      - TS_USERSPACE=false
    volumes:
      - /mnt/tank/apps/tailscale/state:/var/lib/tailscale
      - /dev/net/tun:/dev/net/tun
    restart: unless-stopped
```

If the user prefers you to write the file for review before pasting, put it
at `/mnt/tank/apps/tailscale/docker-compose.yml` first — but do not `docker
compose up` from CLI; deploy through the TrueNAS Apps UI so the app is
tracked by middleware and shows up in the app list.

### 5. Verify the container is running and advertising the route

```
ssh truenas_admin@10.0.0.162 "sudo docker ps --filter name=tailscale"
ssh truenas_admin@10.0.0.162 "sudo docker logs tailscale 2>&1 | tail -40"
```

The log should end with something like:
- `Success.` (auth accepted)
- `Advertising routes: 10.0.0.0/24`
- `magicsock: home is derp-…`

If it says `logtail started` but never `Success.`, the auth key was
rejected — most likely already used with Ephemeral=off previously. Stop
and ask the user to generate a fresh key.

### 6. Report back to the human

Print the tailnet hostname and IPv4 the router got:

```
ssh truenas_admin@10.0.0.162 "sudo docker exec tailscale tailscale ip -4"
ssh truenas_admin@10.0.0.162 "sudo docker exec tailscale tailscale status"
```

Tell the user to do these two browser steps and confirm when done:

1. **Approve the subnet route.** https://login.tailscale.com/admin/machines
   → find `truenas-subnet-router` → `…` menu → Edit route settings → toggle
   `10.0.0.0/24` on. Also click **Disable key expiry** on this machine —
   subnet routers should not silently expire.

2. **Configure Tailscale DNS.** https://login.tailscale.com/admin/dns
   - Enable **MagicDNS** at the top.
   - Nameservers → Add nameserver → **Split DNS**:
     - Domain: `welldonestreams.com`
     - Nameserver: `10.0.0.162`
   - Leave **Override local DNS** off. This scopes the split DNS entry to
     `welldonestreams.com` only, so client DNS for everything else is
     untouched.

### 7. Install the Windows client

```powershell
winget install --id Tailscale.Tailscale --exact --silent
```

(If that ID doesn't resolve, try `winget search tailscale` and use the
returned Id.)

Launch it once so the first-run tray login prompt appears. The user signs
in with the same Tailscale account.

Then verify from PowerShell:

```powershell
& "C:\Program Files\Tailscale\tailscale.exe" status
& "C:\Program Files\Tailscale\tailscale.exe" netcheck
```

`status` should list `truenas-subnet-router` as an available peer with
`10.0.0.0/24` in its offered routes.

### 8. End-to-end verification

Run these from the Windows PC. If the PC is on the LAN, the LAN itself
will answer — you want to prove the *Tailscale* path works. Two options:

- Ask the user to briefly turn off wifi/ethernet, connect to a phone
  hotspot, and rerun the checks.
- Or run the checks from the user's phone Tailscale app: while on
  cellular, hit `https://home.welldonestreams.com` in the phone browser.

The commands to run (either PC on hotspot, or a fresh SSH session from
a machine you know is off-LAN):

```
ping 10.0.0.162
nslookup home.welldonestreams.com
curl -k -sS -o NUL -w "%{http_code}\n" https://home.welldonestreams.com
curl -k -sS -o NUL -w "%{http_code}\n" https://kuma.welldonestreams.com
```

- `nslookup` should resolve `home.welldonestreams.com` to `10.0.0.162`.
  If it returns a Cloudflare public IP instead, the split DNS entry did
  not take — recheck step 6.
- Both `curl` checks should return a valid HTTP status (200, 302, or 401
  for the login-gated apps — anything non-error means the proxy answered).

### 9. Post-deploy documentation

The repository has a shared docs pattern:

- Add a newest-first entry to `WORKLOG.md` summarizing the deployment
  (subnet router advertising 10.0.0.0/24, split DNS for
  welldonestreams.com, approved via admin console, verified from off-LAN
  client, existing OPNsense WireGuard left in place as fallback).
- Add a **Completed maintenance** section to `HOMELAB-HANDOFF.md` under
  the existing 2026-07-25 blocks with the same detail plus the dataset
  path, container config, and MagicDNS/split-DNS design.
- In `HOMELAB-GAMEPLAN.md`, remove the Tailscale bullet from Phase 7
  "Consider later" — it's no longer aspirational.

Stage the doc changes in the same commit as the compose file (if you
saved one to the dataset). Follow the `AGENTS.md` rule: don't commit or
push unless the user requests it.

## Rollback

If anything is broken and the user wants out:

```
ssh truenas_admin@10.0.0.162 "sudo docker stop tailscale && sudo docker rm tailscale"
```

Then in the TrueNAS UI, delete the custom app so it doesn't reappear.
Nothing about this deployment touched NPM, AdGuard, OPNsense, or DNS
records outside Tailscale's own admin console, so removing the container
reverts the environment. The pre-work snapshot from step 1 covers the
dataset if something on-disk needs to go back.

## Non-goals for this session

Do not do any of these without a separate user request:

- Do not migrate OPNsense WireGuard onto Tailscale.
- Do not enable Tailscale exit-node mode.
- Do not set up Tailscale ACLs beyond the default.
- Do not install Tailscale on any device other than the TrueNAS subnet
  router and the Windows PC. The user installs the phone client
  themselves from the App Store / Play Store.
- Do not change the NPM `LAN Only` access list. It doesn't need to change.
