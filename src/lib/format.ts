const PLAYLIST_ID_RE = /^[A-Za-z0-9_-]{10,}$/;

/**
 * Accepts a raw playlist ID or any YouTube URL carrying a `list=` param
 * (playlist page, watch page inside a playlist, youtu.be share link).
 */
export function parsePlaylistId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;
  if (PLAYLIST_ID_RE.test(value)) return value;
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const list = url.searchParams.get("list");
    return list && PLAYLIST_ID_RE.test(list) ? list : null;
  } catch {
    return null;
  }
}

/** Parses ISO 8601 durations as returned by the YouTube API, e.g. PT1H2M3S. */
export function parseIsoDuration(iso: string | undefined): number {
  if (!iso) return 0;
  const m = iso.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return 0;
  const [, d, h, min, s] = m.map((x) => Number(x ?? 0));
  return d * 86400 + h * 3600 + min * 60 + s;
}

/** 3725 -> "1:02:05", 65 -> "1:05" */
export function formatClock(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** 3725 -> "1h 2m", 300 -> "5m", 0 -> "0m" */
export function formatSpan(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function watchUrl(videoId: string, playlistId: string, index?: number): string {
  const params = new URLSearchParams({ v: videoId, list: playlistId });
  if (index !== undefined) params.set("index", String(index + 1));
  return `https://www.youtube.com/watch?${params}`;
}
