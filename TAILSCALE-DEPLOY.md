# Tailscale deployment brief

> **STATUS: COMPLETED 2026-07-26. Do not execute this brief.** The subnet
> router is deployed and live — route approved, split DNS set, off-LAN access
> confirmed by the user. This file is retained as the design record for *why*
> it was built this way. Current state lives in `HOMELAB-HANDOFF.md`
> ("2026-07-26 Tailscale subnet router deployment") and the environment block
> of `HOMELAB-GAMEPLAN.md`.

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
