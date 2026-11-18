"use client";

import { useSyncExternalStore } from "react";
import type { Library, LibraryEntry, Playlist } from "./types";

const STORAGE_KEY = "yt-track:library";
const EMPTY: Library = { version: 1, entries: [] };

let cache: Library | null = null;
const listeners = new Set<() => void>();

function read(): Library {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Library) : null;
    cache = parsed?.version === 1 && Array.isArray(parsed.entries) ? parsed : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Library) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked; keep the in-memory copy so the session still works.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep multiple tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns null during SSR / before hydration so pages can render a skeleton. */
export function useLibrary(): Library | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

function updateEntry(id: string, fn: (e: LibraryEntry) => LibraryEntry) {
  const lib = read();
  write({
    ...lib,
    entries: lib.entries.map((e) =>
      e.playlist.id === id ? { ...fn(e), updatedAt: new Date().toISOString() } : e,
    ),
  });
}

export const library = {
  get: (id: string) => read().entries.find((e) => e.playlist.id === id) ?? null,

  /** Adds a playlist, or refreshes its metadata if already present (keeps progress). */
  upsert(playlist: Playlist) {
    const lib = read();
    const now = new Date().toISOString();
    const existing = lib.entries.find((e) => e.playlist.id === playlist.id);
    if (existing) {
      const ids = new Set(playlist.videos.map((v) => v.id));
      updateEntry(playlist.id, (e) => ({
        ...e,
        playlist,
        // Forget progress for videos that were removed from the playlist.
        watched: e.watched.filter((w) => ids.has(w)),
      }));
      return;
    }
    write({
      ...lib,
      entries: [
        { playlist, watched: [], lastOpenedId: null, addedAt: now, updatedAt: now },
        ...lib.entries,
      ],
    });
  },

  remove(id: string) {
    const lib = read();
    write({ ...lib, entries: lib.entries.filter((e) => e.playlist.id !== id) });
  },

  setWatched(id: string, videoIds: string[], watched: boolean) {
    updateEntry(id, (e) => {
      const set = new Set(e.watched);
      videoIds.forEach((v) => (watched ? set.add(v) : set.delete(v)));
      return { ...e, watched: [...set] };
    });
  },

  /** Records that a video was opened on YouTube; drives the "did you finish it?" prompt. */
  markOpened(id: string, videoId: string) {
    updateEntry(id, (e) => ({ ...e, lastOpenedId: videoId }));
  },

  clearOpened(id: string) {
    updateEntry(id, (e) => ({ ...e, lastOpenedId: null }));
  },

  exportJson: () => JSON.stringify(read(), null, 2),

  /** Merges an exported library into the current one. Returns the number of playlists imported. */
  importJson(text: string): number {
    const incoming = JSON.parse(text) as Library;
    if (incoming?.version !== 1 || !Array.isArray(incoming.entries)) {
      throw new Error("Not a yt-track export file.");
    }
    const lib = read();
    const byId = new Map(lib.entries.map((e) => [e.playlist.id, e]));
    for (const e of incoming.entries) {
      const cur = byId.get(e.playlist.id);
      if (!cur || e.updatedAt > cur.updatedAt) byId.set(e.playlist.id, e);
    }
    write({ ...lib, entries: [...byId.values()] });
    return incoming.entries.length;
  },
};

export type Progress = {
  watchedCount: number;
  total: number;
  watchedSec: number;
  totalSec: number;
  /** 0..1, weighted by duration. */
  ratio: number;
  nextIndex: number;
};

export function progressOf(entry: LibraryEntry): Progress {
  const watched = new Set(entry.watched);
  let watchedSec = 0;
  let totalSec = 0;
  let watchedCount = 0;
  let nextIndex = -1;
  entry.playlist.videos.forEach((v, i) => {
    totalSec += v.durationSec;
    if (watched.has(v.id)) {
      watchedSec += v.durationSec;
      watchedCount++;
    } else if (nextIndex === -1) {
      nextIndex = i;
    }
  });
  const total = entry.playlist.videos.length;
  const ratio = totalSec > 0 ? watchedSec / totalSec : total > 0 ? watchedCount / total : 0;
  return { watchedCount, total, watchedSec, totalSec, ratio, nextIndex };
}
