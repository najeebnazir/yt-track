import "server-only";
import { parseIsoDuration } from "./format";
import type { Playlist, Video } from "./types";

const API = "https://www.googleapis.com/youtube/v3";
/** Safety cap: 40 pages x 50 items. */
const MAX_PAGES = 40;

export class YouTubeError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type Thumbs = Record<string, { url: string } | undefined> | undefined;

function pickThumb(thumbs: Thumbs): string | null {
  if (!thumbs) return null;
  return (thumbs.medium ?? thumbs.high ?? thumbs.default ?? thumbs.standard)?.url ?? null;
}

async function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new YouTubeError("Server is missing YOUTUBE_API_KEY.", 500);

  const qs = new URLSearchParams({ ...params, key });
  const res = await fetch(`${API}/${path}?${qs}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const msg = body?.error?.message ?? `YouTube API error (${res.status})`;
    throw new YouTubeError(msg, res.status === 404 ? 404 : 502);
  }
  return res.json() as Promise<T>;
}

type PlaylistsResponse = {
  items: { snippet: { title: string; channelTitle: string; thumbnails: Thumbs } }[];
};

type PlaylistItemsResponse = {
  nextPageToken?: string;
  items: {
    snippet: { title: string; position: number; thumbnails: Thumbs; resourceId: { videoId: string } };
    status?: { privacyStatus?: string };
  }[];
};

type VideosResponse = {
  items: { id: string; contentDetails: { duration: string } }[];
};

export async function fetchPlaylist(playlistId: string): Promise<Playlist> {
  const meta = await call<PlaylistsResponse>("playlists", { part: "snippet", id: playlistId });
  const info = meta.items[0]?.snippet;
  if (!info) throw new YouTubeError("Playlist not found or is private.", 404);

  // 1. Walk every page of the playlist.
  const items: PlaylistItemsResponse["items"] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await call<PlaylistItemsResponse>("playlistItems", {
      part: "snippet,status",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    items.push(...res.items);
    pageToken = res.nextPageToken;
    if (!pageToken) break;
  }

  // Drop deleted / private entries, which have no playable video.
  const playable = items.filter(
    (it) => it.status?.privacyStatus !== "private" && it.snippet.title !== "Deleted video",
  );

  // 2. Durations come from the videos endpoint, 50 IDs per request.
  const durations = new Map<string, number>();
  const ids = [...new Set(playable.map((it) => it.snippet.resourceId.videoId))];
  for (let i = 0; i < ids.length; i += 50) {
    const res = await call<VideosResponse>("videos", {
      part: "contentDetails",
      id: ids.slice(i, i + 50).join(","),
    });
    for (const v of res.items) durations.set(v.id, parseIsoDuration(v.contentDetails.duration));
  }

  const seen = new Set<string>();
  const videos: Video[] = [];
  for (const it of playable) {
    const id = it.snippet.resourceId.videoId;
    // Videos missing from the videos endpoint are unavailable; duplicates are skipped.
    if (!durations.has(id) || seen.has(id)) continue;
    seen.add(id);
    videos.push({
      id,
      title: it.snippet.title,
      position: videos.length,
      durationSec: durations.get(id)!,
      thumbnail: pickThumb(it.snippet.thumbnails),
    });
  }

  return {
    id: playlistId,
    title: info.title,
    channelTitle: info.channelTitle,
    thumbnail: pickThumb(info.thumbnails) ?? videos[0]?.thumbnail ?? null,
    videos,
    syncedAt: new Date().toISOString(),
  };
}
