# Homelab handoff

Last verified: 2026-07-23 (America/Los_Angeles)

This file records durable homelab state for Codex and Claude. It intentionally
contains no passwords, API keys, tokens, cookies, or certificate credentials.

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

- Do not perform the OPNsense 26.7 feature upgrade unattended. Export a current
  configuration backup and schedule a short network maintenance window first.
- Add an off-box replication target for irreplaceable data. Local snapshots
  protect against mistakes and ransomware history, but not loss of the server.
- Homepage still triggers TrueNAS's deprecated legacy REST API warning. Upgrade
  or replace that widget when a compatible Homepage release is available before
  moving TrueNAS to a release that removes the endpoint.
- The best next application is Uptime Kuma. Add it after choosing notification
  targets, then monitor the public services, both trusted admin names, DNS, and
  the Renewals endpoint. Avoid installing it without alert delivery configured.
- Kometa remains intentionally stopped and was not the source of the Renewals
  startup failure.
