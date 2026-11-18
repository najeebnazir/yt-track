import type { Playlist } from "./types";

export async function fetchPlaylistFromApi(idOrUrl: string): Promise<Playlist> {
  const res = await fetch(`/api/playlist?id=${encodeURIComponent(idOrUrl)}`);
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
  return body as Playlist;
}
