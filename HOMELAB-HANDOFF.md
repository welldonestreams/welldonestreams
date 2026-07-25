# Homelab handoff

Last verified: 2026-07-25 (America/Los_Angeles)

This file records durable homelab state for Codex and Claude. It intentionally
contains no passwords, API keys, tokens, cookies, or certificate credentials.
The prioritized remaining work is maintained in `HOMELAB-GAMEPLAN.md`.

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
- Radarr has shown the same ID-only matching condition for The Invitation; verify
  the actual movie and year before Manual Import.
- Radarr has also shown an archive warning for Elio. First confirm NZBGet's native
  Unpack setting and inspect the NZBGet History log for password protection,
  missing RAR volumes, failed PAR2 repair, permissions, or insufficient space.
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
- Do not perform the OPNsense 26.7 feature upgrade unattended. Export a current
  configuration backup and schedule a short network maintenance window first.
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
