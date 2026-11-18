import Image from "next/image";
import Link from "next/link";
import { formatSpan } from "@/lib/format";
import { progressOf } from "@/lib/library";
import type { LibraryEntry } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";
import { Badge, StatusDot } from "./ui";

function relativeTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  const fmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (diff < 60) return "just now";
  if (diff < 3600) return fmt.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return fmt.format(-Math.round(diff / 3600), "hour");
  if (diff < 86400 * 30) return fmt.format(-Math.round(diff / 86400), "day");
  return new Date(iso).toLocaleDateString();
}

export function PlaylistCard({ entry }: { entry: LibraryEntry }) {
  const { playlist } = entry;
  const p = progressOf(entry);
  const done = p.total > 0 && p.watchedCount === p.total;
  const status = done ? "done" : p.watchedCount > 0 ? "active" : "idle";

  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-all hover:border-border-strong hover:shadow-[0_4px_16px_-4px_var(--ring)]"
    >
      <div className="relative aspect-video overflow-hidden border-b border-border bg-surface-2">
        {playlist.thumbnail && (
          <Image
            src={playlist.thumbnail}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 space-y-1">
          <h3 className="line-clamp-2 text-[15px] font-medium leading-snug tracking-tight">{playlist.title}</h3>
          <p className="truncate text-[13px] text-muted">{playlist.channelTitle}</p>
        </div>
        <div className="mt-auto space-y-3">
          <ProgressBar ratio={p.ratio} />
          <div className="flex items-center justify-between gap-2 text-[13px]">
            <span className="flex items-center gap-2 text-muted">
              <StatusDot status={status} />
              {done ? "Completed" : status === "active" ? relativeTime(entry.updatedAt) : "Not started"}
            </span>
            <span className="flex items-center gap-1.5">
              {!done && <Badge>{formatSpan(p.totalSec - p.watchedSec)} left</Badge>}
              <Badge tone={done ? "success" : "neutral"}>
                {p.watchedCount}/{p.total}
              </Badge>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
