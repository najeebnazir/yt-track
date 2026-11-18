"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatClock } from "@/lib/format";
import { library } from "@/lib/library";
import type { LibraryEntry } from "@/lib/types";
import { Button } from "./ui";

/**
 * After a video is opened on YouTube, asks "did you finish it?" once the user
 * comes back to this tab (or on the next visit, since `lastOpenedId` is persisted).
 *
 * `armedFor` is the opened video the prompt may ask about. It is captured on mount
 * and whenever the tab regains focus, so clicking a video doesn't prompt
 * immediately; only returning does.
 */
export function WatchedPrompt({ entry }: { entry: LibraryEntry }) {
  const playlistId = entry.playlist.id;
  const [armedFor, setArmedFor] = useState<string | null>(entry.lastOpenedId);
  const primary = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState === "visible") {
        setArmedFor(library.get(playlistId)?.lastOpenedId ?? null);
      }
    };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [playlistId]);

  const video =
    armedFor && armedFor === entry.lastOpenedId && !entry.watched.includes(armedFor)
      ? entry.playlist.videos.find((v) => v.id === armedFor)
      : undefined;

  useEffect(() => {
    if (!video) return;
    primary.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && answer(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  if (!video) return null;

  function answer(finished: boolean) {
    if (finished) library.setWatched(playlistId, [video!.id], true);
    library.clearOpened(playlistId);
    setArmedFor(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="watched-prompt-title"
        className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-background shadow-[0_16px_48px_-12px_rgba(0,0,0,0.35)]"
      >
        <div className="space-y-4 p-5">
          <div className="space-y-1">
            <h2 id="watched-prompt-title" className="text-lg font-semibold tracking-tight">
              Welcome back. Did you finish it?
            </h2>
            <p className="text-sm text-muted">Mark this video as watched to update your progress.</p>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5">
            <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">
              {video.thumbnail && <Image src={video.thumbnail} alt="" fill sizes="96px" className="object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[11px] tracking-wider text-subtle uppercase">
                #{video.position + 1} · {formatClock(video.durationSec)}
              </p>
              <p className="line-clamp-2 text-sm font-medium">{video.title}</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border bg-surface px-5 py-3">
          <Button size="sm" onClick={() => answer(false)}>
            Not yet
          </Button>
          <Button ref={primary} size="sm" variant="primary" onClick={() => answer(true)}>
            Mark as watched
          </Button>
        </div>
      </div>
    </div>
  );
}
