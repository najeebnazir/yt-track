"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { Badge, Button, buttonClass, Checkbox } from "@/components/ui";
import { WatchedPrompt } from "@/components/WatchedPrompt";
import { fetchPlaylistFromApi } from "@/lib/api";
import { formatClock, formatSpan, watchUrl } from "@/lib/format";
import { library, progressOf, useLibrary } from "@/lib/library";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="space-y-1 px-5 py-4">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">
        {value}
        {sub && <span className="ml-1 text-sm font-normal text-subtle">{sub}</span>}
      </p>
    </div>
  );
}

const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden>
    <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
  </svg>
);

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const lib = useLibrary();
  const [hideWatched, setHideWatched] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const lastClicked = useRef<number | null>(null);

  if (lib === null) return null;
  const entry = lib.entries.find((e) => e.playlist.id === id);
  if (!entry) {
    return (
      <div className="mt-24 flex flex-col items-center gap-4 text-center">
        <p className="text-lg font-medium">Playlist not in your library</p>
        <Link href="/" className={buttonClass("secondary", "sm")}>
          Back to library
        </Link>
      </div>
    );
  }

  const { playlist } = entry;
  const watched = new Set(entry.watched);
  const p = progressOf(entry);
  const next = p.nextIndex >= 0 ? playlist.videos[p.nextIndex] : null;
  const pct = Math.round(p.ratio * 100);

  function toggle(index: number, checked: boolean, shift: boolean) {
    const anchor = shift ? lastClicked.current : null;
    const from = anchor !== null ? Math.min(anchor, index) : index;
    const to = anchor !== null ? Math.max(anchor, index) : index;
    library.setWatched(id, playlist.videos.slice(from, to + 1).map((v) => v.id), checked);
    lastClicked.current = index;
  }

  async function sync() {
    setSyncing(true);
    setSyncError(null);
    try {
      library.upsert(await fetchPlaylistFromApi(id));
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncing(false);
    }
  }

  function remove() {
    if (!confirm(`Remove “${playlist.title}” and its progress from your library?`)) return;
    library.remove(id);
    router.push("/");
  }

  const allIds = playlist.videos.map((v) => v.id);
  const rows = playlist.videos.filter((v) => !hideWatched || !watched.has(v.id));

  return (
    <div className="space-y-8 pt-8">
      <WatchedPrompt key={playlist.id} entry={entry} />
      {/* Header */}
      <section className="flex flex-col gap-6 md:flex-row md:items-start">
        {playlist.thumbnail && (
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2 md:w-64">
            <Image src={playlist.thumbnail} alt="" fill sizes="256px" className="object-cover" priority />
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {p.watchedCount === p.total && p.total > 0 ? (
                <Badge tone="success">Completed</Badge>
              ) : (
                <Badge>Playlist</Badge>
              )}
              <span className="font-mono text-xs text-subtle" title={new Date(playlist.syncedAt).toLocaleString()}>
                synced {new Date(playlist.syncedAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-[-0.03em]">{playlist.title}</h1>
            <p className="text-muted">{playlist.channelTitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {next && (
              <a
                href={watchUrl(next.id, playlist.id, p.nextIndex)}
                target="_blank"
                rel="noreferrer"
                onClick={() => library.markOpened(id, next.id)}
                className={buttonClass("primary", "sm")}
              >
                <PlayIcon />
                {p.watchedCount === 0 ? "Start watching" : "Continue"}
              </a>
            )}
            <Button size="sm" onClick={sync} disabled={syncing}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                className={syncing ? "animate-spin" : ""}
                aria-hidden
              >
                <path
                  d="M13.5 8a5.5 5.5 0 01-9.4 3.9M2.5 8a5.5 5.5 0 019.4-3.9M12 1.5v2.75h-2.75M4 14.5v-2.75h2.75"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {syncing ? "Syncing…" : "Sync"}
            </Button>
            <a
              href={`https://www.youtube.com/playlist?list=${playlist.id}`}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("secondary", "sm")}
            >
              Open on YouTube ↗
            </a>
            <Button size="sm" variant="danger" onClick={remove}>
              Remove
            </Button>
          </div>
          {syncError && <p className="text-[13px] text-danger">{syncError}</p>}
        </div>
      </section>

      {/* Stats */}
      <section className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-border md:[&>*:nth-child(n+3)]:border-t-0 [&>*:nth-child(2n)]:border-l [&>*:nth-child(2n)]:border-border md:[&>*:nth-child(2n)]:border-l-0">
          <Stat label="Progress" value={`${pct}%`} />
          <Stat label="Videos watched" value={String(p.watchedCount)} sub={`/ ${p.total}`} />
          <Stat label="Time watched" value={formatSpan(p.watchedSec)} />
          <Stat label="Time left" value={formatSpan(p.totalSec - p.watchedSec)} />
        </div>
        <ProgressBar ratio={p.ratio} className="rounded-none" />
      </section>

      {/* Up next */}
      {next && (
        <a
          href={watchUrl(next.id, playlist.id, p.nextIndex)}
          target="_blank"
          rel="noreferrer"
          onClick={() => library.markOpened(id, next.id)}
          className="group flex items-center gap-4 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-border-strong"
        >
          <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md border border-border bg-surface-2">
            {next.thumbnail && <Image src={next.thumbnail} alt="" fill sizes="112px" className="object-cover" />}
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
              <PlayIcon />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-subtle">
              Up next · #{p.nextIndex + 1}
            </p>
            <p className="truncate font-medium">{next.title}</p>
          </div>
          <span className="hidden font-mono text-xs text-muted sm:block">{formatClock(next.durationSec)}</span>
          <span className="pr-1 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden>
            →
          </span>
        </a>
      )}

      {/* Videos */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Videos</h2>
          <div className="flex items-center gap-1">
            <label className="mr-2 flex cursor-pointer items-center gap-2 text-[13px] text-muted select-none">
              <Checkbox checked={hideWatched} onChange={(e) => setHideWatched(e.target.checked)} />
              Hide watched
            </label>
            <Button variant="ghost" size="sm" onClick={() => library.setWatched(id, allIds, true)}>
              Mark all
            </Button>
            <Button variant="ghost" size="sm" onClick={() => library.setWatched(id, allIds, false)}>
              Reset
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="flex h-9 items-center gap-3 border-b border-border bg-surface px-4 font-mono text-[11px] uppercase tracking-wider text-subtle">
            <span className="w-4" />
            <span className="w-7 text-right">#</span>
            <span className="flex-1">Title</span>
            <span className="hidden sm:inline">Shift-click for range</span>
            <span className="w-14 text-right">Length</span>
          </div>
          <ol className="divide-y divide-border">
            {rows.map((v) => {
              const isWatched = watched.has(v.id);
              const isNext = next?.id === v.id;
              return (
                <li
                  key={v.id}
                  className={`group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface ${
                    isNext ? "bg-surface" : ""
                  }`}
                >
                  <Checkbox
                    checked={isWatched}
                    aria-label={`Mark “${v.title}” as watched`}
                    onChange={(e) =>
                      toggle(v.position, e.target.checked, (e.nativeEvent as MouseEvent).shiftKey)
                    }
                  />
                  <span className="w-7 shrink-0 text-right font-mono text-xs text-subtle tabular-nums">
                    {v.position + 1}
                  </span>
                  <div className="relative hidden aspect-video w-20 shrink-0 overflow-hidden rounded border border-border bg-surface-2 sm:block">
                    {v.thumbnail && (
                      <Image
                        src={v.thumbnail}
                        alt=""
                        fill
                        sizes="80px"
                        className={`object-cover transition ${isWatched ? "opacity-40 grayscale" : ""}`}
                      />
                    )}
                  </div>
                  <a
                    href={watchUrl(v.id, playlist.id, v.position)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => library.markOpened(id, v.id)}
                    className={`min-w-0 flex-1 truncate text-sm hover:underline hover:underline-offset-4 ${
                      isWatched ? "text-subtle" : ""
                    }`}
                    title={v.title}
                  >
                    {v.title}
                  </a>
                  {isNext && (
                    <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-blue">
                      <span className="size-1.5 animate-pulse rounded-full bg-blue" aria-hidden />
                      Next
                    </span>
                  )}
                  <span className="w-14 shrink-0 text-right font-mono text-xs text-muted tabular-nums">
                    {formatClock(v.durationSec)}
                  </span>
                </li>
              );
            })}
            {rows.length === 0 && (
              <li className="px-4 py-12 text-center text-sm text-muted">All caught up. Nice work.</li>
            )}
          </ol>
        </div>
      </section>
    </div>
  );
}
