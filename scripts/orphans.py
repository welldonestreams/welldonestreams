#!/usr/bin/env python3
"""List movie files on disk that Radarr no longer tracks.

Background: `DELETE /api/v3/moviefile/bulk` returns HTTP 200 and clears the
database records but leaves every file on disk. After the 2026-07-26 1080p
standardization this left 49 orphaned 4K/Remux files (1.42 TB) that Radarr
had no knowledge of. See HOMELAB-HANDOFF.md, "1080p standardization".

Read-only. It prints; it never deletes. Deleting user media is a human's job
(agent safety guards block it, correctly).

Usage:
    export RADARR_KEY=...        # never commit this
    sudo -E python3 scripts/orphans.py
    sudo -E python3 scripts/orphans.py --json

This lives in the repo rather than /tmp because /tmp does not survive a
reboot and the punch list depends on it.
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request

RADARR_URL = os.environ.get("RADARR_URL", "http://10.0.0.162:30025")

# Host paths Radarr writes movie folders into. Radarr reports container paths
# under /data/, so they are translated with HOST_PREFIX below.
ROOTS = [
    "/mnt/tank/data/media/movies",
    "/mnt/tank/data/media/anime/movies",
]
CONTAINER_PREFIX = "/data/"
HOST_PREFIX = "/mnt/tank/data/"

VIDEO_EXTENSIONS = (".mkv", ".mp4", ".avi", ".m4v", ".ts", ".iso", ".img")

# Titles deliberately kept at low quality because no 1080p release exists yet.
# These will show up as orphans and must NOT be deleted. Remove a title from
# this list once Radarr has grabbed a real release for it.
INTENTIONAL_CAMS = [
    "toy story 5",
    "moana",
    "the invite",
    "the odyssey",
    "evil dead burn",
    "minions",
]


def radarr_tracked_paths(api_key):
    """Return the set of host paths Radarr currently has a file record for."""
    request = urllib.request.Request(
        f"{RADARR_URL}/api/v3/movie", headers={"X-Api-Key": api_key}
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            movies = json.load(response)
    except urllib.error.HTTPError as error:
        sys.exit(f"Radarr returned HTTP {error.code} — check RADARR_KEY.")
    except urllib.error.URLError as error:
        sys.exit(f"Could not reach Radarr at {RADARR_URL}: {error.reason}")

    tracked = set()
    for movie in movies:
        movie_file = movie.get("movieFile")
        if movie_file and movie_file.get("path"):
            tracked.add(movie_file["path"].replace(CONTAINER_PREFIX, HOST_PREFIX))
    return tracked


def files_on_disk():
    """Walk the movie roots and yield every video file present."""
    for root in ROOTS:
        if not os.path.isdir(root):
            print(f"warning: {root} does not exist, skipping", file=sys.stderr)
            continue
        for directory, _subdirs, filenames in os.walk(root):
            for filename in filenames:
                if filename.lower().endswith(VIDEO_EXTENSIONS):
                    yield os.path.join(directory, filename)


def is_intentional(path):
    lowered = os.path.basename(path).lower()
    return any(title in lowered for title in INTENTIONAL_CAMS)


def human(size_bytes):
    value = float(size_bytes)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if value < 1024 or unit == "TB":
            return f"{value:.1f} {unit}"
        value /= 1024


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="machine-readable output")
    args = parser.parse_args()

    api_key = os.environ.get("RADARR_KEY")
    if not api_key:
        sys.exit("Set RADARR_KEY in the environment (Radarr -> Settings -> General).")

    tracked = radarr_tracked_paths(api_key)

    deletable, retained = [], []
    for path in sorted(files_on_disk()):
        if path in tracked:
            continue
        try:
            size = os.path.getsize(path)
        except OSError:
            size = 0
        (retained if is_intentional(path) else deletable).append(
            {"path": path, "bytes": size}
        )

    if args.json:
        print(json.dumps({"deletable": deletable, "retained": retained}, indent=2))
        return

    total = sum(entry["bytes"] for entry in deletable)
    print(f"Radarr tracks {len(tracked)} movie files.\n")

    if retained:
        print(f"Intentionally retained ({len(retained)}) — do NOT delete:")
        for entry in retained:
            print(f"  {human(entry['bytes']):>9}  {entry['path']}")
        print()

    if not deletable:
        print("No untracked files. Orphan cleanup is complete.")
        return

    print(f"Untracked / deletable ({len(deletable)}, {human(total)}):")
    for entry in deletable:
        print(f"  {human(entry['bytes']):>9}  {entry['path']}")
    print(
        "\nReview this list before deleting anything. Roll back with the\n"
        "tank/data/media@pre-1080p-standardize-20260726 snapshot if needed."
    )


if __name__ == "__main__":
    main()
