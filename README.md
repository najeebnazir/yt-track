# yt-track

Keep track of YouTube playlists and courses you're working through. Add a playlist to your library, tick videos off as you watch them, and see how much is left.

## Features

- Add any public or unlisted playlist by pasting its URL (playlist page, a watch URL with `list=`, or the bare ID).
- Per-video watched checkboxes, with shift-click to mark a range.
- Progress by video count and by watch time, plus a **Continue** button that opens the next unwatched video on YouTube.
- Library grouped into In progress / Not started / Completed.
- **Sync with YouTube** pulls in newly added videos and keeps your progress.
- Export and import a JSON backup of your library.

Progress is stored in the browser (`localStorage`); there are no accounts yet.

## Setup

1. Create a YouTube Data API v3 key in the [Google Cloud console](https://console.cloud.google.com/apis/credentials) (enable the "YouTube Data API v3" API for the project).
2. Copy the env template and add the key:

   ```bash
   cp .env.example .env.local
   ```

3. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   Then open http://localhost:3000.

## How it works

| Piece | Where |
| --- | --- |
| YouTube API client (server only, keeps the key private) | `src/lib/youtube.ts` |
| `GET /api/playlist?id=<url or id>` | `src/app/api/playlist/route.ts` |
| Library store (`localStorage` + `useSyncExternalStore`, syncs across tabs) | `src/lib/library.ts` |
| Library page | `src/app/page.tsx` |
| Playlist page | `src/app/playlist/[id]/page.tsx` |

Fetching a playlist costs roughly `2 + 2 × ceil(videos / 50)` API quota units (the default daily quota is 10,000). Private, deleted and duplicate videos are skipped.
