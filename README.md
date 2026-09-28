# Save Point — Game Journal (Iteration 1)

An offline-capable PWA for a personal game library. The name is provisional.

## Features
- Add, edit, delete and search games
- Wishlist, Playing, Paused, Completed, Dropped
- Completion rating and optional note; optional drop reason and note
- Local milestone history for each game
- JSON backup export/import
- Installable PWA with offline app shell

## Run locally
A PWA needs HTTP(S), not `file://`. From this folder run:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. For phone installation, deploy the entire folder to GitHub Pages or another HTTPS host. The manifest and service worker use relative paths, so GitHub Pages subpaths work.

## Privacy and storage
All game records are stored in the current browser's `localStorage`. Installing on another device does **not** sync them. Use Export backup regularly. Import **replaces** the current library. Clearing browser/site data may delete your library. Cover URLs are optional and remote images may not be available offline.

## Future iterations
External game database search, repeat playthroughs, timeline, personal tags, recommendations, statistics and optional cloud sync.
