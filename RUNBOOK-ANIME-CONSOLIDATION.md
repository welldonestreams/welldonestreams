---
title: Runbook — Anime Library Consolidation
date: 2026-07-31
tags: [runbook, anime, media, plex, sonarr]
status: in-progress
---

# Runbook: Anime Library Consolidation

## Goal
Consolidate the anime library so anime TV lives under one root with correct Sonarr absolute numbering, and anime films route to Movies/Radarr.

## Current state (VERIFIED live 2026-07-31 via TrueNAS API)
- `tank/data/media/anime` exists: **277.42 GiB**, containing **10 anime TV show dirs directly** (Solo Leveling, One Piece, Vinland Saga, Erased, Avatar, Arcane, Black Clover, Korra, Promised Neverland, Frieren...).
- **`anime/movies` subdir: GONE** — anime-films migration to main Movies is done at the filesystem level.
- **`anime/series` subdir: GONE** — shows live at the anime dataset top level.
- Main movies dataset: 5.26 TiB; series: 1.87 TiB; media total 7.4 TiB.
- **Remaining unknowns (need app-level check, not filesystem):** (a) Sonarr anime root folder — if it still points at `/data/media/anime/series`, it's stale and must be re-pointed to `/data/media/anime`; (b) Plex library state — old entries/trash may still reference removed paths; empty trash manually after verifying.
- Status: **mostly complete; app-level verification pending.**

## Rules / gotchas
- TV directory is `series` NOT `tv` anywhere in the stack.
- Watch mode: DUBBED — prefer dubbed releases in any manual picks.
- Plex auto-empty trash is OFF — empty trash manually only after verified library changes.
- Sonarr/Radarr remote path mapping: host 10.0.0.162, remote `/downloads/`, local `/data/usenet/`.

## Steps (each verified, one at a time, dry-run first)
1. `ls` live dataset state: anime/series, anime/movies, main movies/series — confirm what still exists.
2. Confirm Sonarr anime series all point at `/data/media/anime/series` (absolute numbering enabled).
3. Move/merge any anime films from anime/movies into main Movies via Radarr (root folder change + re-match), then remove the anime/movies root from Radarr.
4. Empty Plex trash (manual, after library verified).
5. Update this runbook + WELL-DONE-HOMELAB.md after each verified step; trust live state over docs.

## Open questions to resolve live
- Sonarr anime root folder: still `/data/media/anime/series` or re-pointed to `/data/media/anime`? (filesystem shows no `series` subdir — root likely stale)
- Plex: do old anime paths still appear in libraries/trash? (Plex auto-trash is OFF — manual check needed)
- Anime dataset usage at last check: 277.42 GiB.

## Related
- [[HOMELAB-KB]] · [[RUNBOOK-BACKUP-STRATEGY]]
