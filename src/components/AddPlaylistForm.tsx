"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchPlaylistFromApi } from "@/lib/api";
import { parsePlaylistId } from "@/lib/format";
import { library } from "@/lib/library";
import { Button, Kbd } from "./ui";

export function AddPlaylistForm() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Press "/" anywhere to jump to the input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(target.tagName)) {
        e.preventDefault();
        input.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = parsePlaylistId(value);
    if (!id) {
      setError("Paste a YouTube playlist link (it should contain “list=”) or a playlist ID.");
      return;
    }
    if (library.get(id)) {
      router.push(`/playlist/${id}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const playlist = await fetchPlaylistFromApi(id);
      library.upsert(playlist);
      setValue("");
      router.push(`/playlist/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xl space-y-2">
      <div className="flex gap-2 rounded-lg border border-border bg-background p-1.5 shadow-[0_2px_8px_-2px_var(--ring)] transition-shadow focus-within:border-border-strong focus-within:shadow-[0_0_0_4px_var(--ring)]">
        <div className="flex min-w-0 flex-1 items-center gap-2 pl-2">
          <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0 text-subtle" aria-hidden>
            <path
              d="M6.5 9.5l3-3M7 4.5l1-1a2.83 2.83 0 014 4l-1 1M9 11.5l-1 1a2.83 2.83 0 01-4-4l1-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={input}
            type="text"
            inputMode="url"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            placeholder="Paste a playlist URL…"
            aria-label="YouTube playlist URL"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle"
          />
          {!value && (
            <span className="hidden sm:inline-flex">
              <Kbd>/</Kbd>
            </span>
          )}
        </div>
        <Button type="submit" variant="primary" size="sm" className="h-9" disabled={loading || !value.trim()}>
          {loading && (
            <svg className="size-3.5 animate-spin" viewBox="0 0 16 16" aria-hidden>
              <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
              <path d="M14 8a6 6 0 00-6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          {loading ? "Fetching" : "Add playlist"}
        </Button>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-[13px] text-danger">
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 4.5v4M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {error}
        </p>
      )}
    </form>
  );
}
