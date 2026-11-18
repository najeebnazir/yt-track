import { NextResponse, type NextRequest } from "next/server";
import { parsePlaylistId } from "@/lib/format";
import { fetchPlaylist, YouTubeError } from "@/lib/youtube";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("id") ?? "";
  const id = parsePlaylistId(raw);
  if (!id) {
    return NextResponse.json({ error: "Not a valid playlist URL or ID." }, { status: 400 });
  }

  try {
    return NextResponse.json(await fetchPlaylist(id));
  } catch (err) {
    if (err instanceof YouTubeError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Unexpected error fetching playlist." }, { status: 500 });
  }
}
