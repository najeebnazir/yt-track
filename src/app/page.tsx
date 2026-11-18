"use client";

import { useRef, useState } from "react";
import { AddPlaylistForm } from "@/components/AddPlaylistForm";
import { PlaylistCard } from "@/components/PlaylistCard";
import { Button } from "@/components/ui";
import { formatSpan } from "@/lib/format";
import { library, progressOf, useLibrary } from "@/lib/library";
import type { LibraryEntry } from "@/lib/types";

type Filter = "all" | "active" | "idle" | "done";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "In progress" },
  { key: "idle", label: "Not started" },
  { key: "done", label: "Completed" },
];

function statusOf(e: LibraryEntry): Exclude<Filter, "all"> {
  const p = progressOf(e);
  if (p.total > 0 && p.watchedCount === p.total) return "done";
  return p.watchedCount > 0 ? "active" : "idle";
}

const STATUS_ORDER = { active: 0, idle: 1, done: 2 } as const;

export default function LibraryPage() {
  const lib = useLibrary();
  const fileInput = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function onExport() {
    const blob = new Blob([library.exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `yt-track-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const n = library.importJson(await file.text());
      setNotice(`Imported ${n} playlist${n === 1 ? "" : "s"}.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Import failed.");
    }
  }

  const entries = lib?.entries ?? [];
  const withStatus = entries.map((e) => ({ e, s: statusOf(e) }));
  const counts = { all: entries.length, active: 0, idle: 0, done: 0 };
  withStatus.forEach(({ s }) => counts[s]++);

  const q = query.trim().toLowerCase();
  const visible = withStatus
    .filter(({ s }) => filter === "all" || s === filter)
    .filter(
      ({ e }) =>
        !q || e.playlist.title.toLowerCase().includes(q) || e.playlist.channelTitle.toLowerCase().includes(q),
    )
    .sort((a, b) => STATUS_ORDER[a.s] - STATUS_ORDER[b.s] || b.e.updatedAt.localeCompare(a.e.updatedAt))
    .map(({ e }) => e);

  const totals = entries.reduce(
    (acc, e) => {
      const p = progressOf(e);
      acc.videos += p.watchedCount;
      acc.sec += p.watchedSec;
      return acc;
    },
    { videos: 0, sec: 0 },
  );

  return (
    <div>
      <section className="relative -mx-4 border-b border-border px-4 pt-16 pb-12 sm:-mx-6 sm:px-6">
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex flex-col items-center gap-6 text-center">
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Finish what you start.</h1>
            <p className="mx-auto max-w-md text-muted">
              Add YouTube playlists and courses to your library, tick off videos as you go, and always know
              what’s next.
            </p>
          </div>
          <AddPlaylistForm />
          {totals.videos > 0 && (
            <p className="font-mono text-xs text-subtle">
              {totals.videos} videos · {formatSpan(totals.sec)} watched across {entries.length} playlist
              {entries.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </section>

      {lib === null ? null : entries.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
          <p className="font-medium">No playlists yet</p>
          <p className="max-w-sm text-sm text-muted">
            Paste a link to any public or unlisted YouTube playlist above to start tracking it.
          </p>
        </div>
      ) : (
        <section className="mt-8 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 overflow-x-auto rounded-md border border-border bg-surface p-1" role="tablist">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex h-7 shrink-0 items-center gap-1.5 rounded px-2.5 text-[13px] font-medium transition-colors ${
                    filter === f.key
                      ? "bg-background text-foreground shadow-[0_0_0_1px_var(--border),0_1px_2px_var(--ring)]"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {f.label}
                  <span className="font-mono text-[11px] text-subtle">{counts[f.key]}</span>
                </button>
              ))}
            </div>
            <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 focus-within:border-border-strong sm:w-64">
              <svg width="14" height="14" viewBox="0 0 16 16" className="shrink-0 text-subtle" aria-hidden>
                <circle cx="7" cy="7" r="4.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search library…"
                aria-label="Search library"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
              />
            </div>
          </div>

          {visible.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((e) => (
                <PlaylistCard key={e.playlist.id} entry={e} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border-strong py-12 text-center text-sm text-muted">
              No playlists match.
            </p>
          )}
        </section>
      )}

      {lib !== null && (
        <footer className="mt-16 flex flex-col gap-3 border-t border-border pt-6 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            Progress is saved in this browser.
            {notice && <span className="text-foreground">{notice}</span>}
          </span>
          <span className="flex gap-1">
            {entries.length > 0 && (
              <Button variant="ghost" size="sm" onClick={onExport}>
                Export backup
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>
              Import backup
            </Button>
          </span>
          <input ref={fileInput} type="file" accept="application/json" hidden onChange={onImport} />
        </footer>
      )}
    </div>
  );
}
