export type Video = {
  id: string;
  title: string;
  /** Position in the playlist, 0-based. */
  position: number;
  durationSec: number;
  thumbnail: string | null;
};

export type Playlist = {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string | null;
  videos: Video[];
  /** ISO timestamp of the last fetch from YouTube. */
  syncedAt: string;
};

export type LibraryEntry = {
  playlist: Playlist;
  /** IDs of videos the user has marked watched. */
  watched: string[];
  /** Most recently opened video, used for "continue". */
  lastOpenedId: string | null;
  addedAt: string;
  updatedAt: string;
};

export type Library = {
  version: 1;
  entries: LibraryEntry[];
};
