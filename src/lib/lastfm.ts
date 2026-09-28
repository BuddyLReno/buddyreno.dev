// Last.fm recent tracks, fetched in the browser on each page load.

export interface Track {
  name: string;
  artist: string;
  url: string;
  nowPlaying: boolean;
  playedAt?: Date;
}

export function recentTracksUrl(user: string, apiKey: string, limit = 10): string {
  const params = new URLSearchParams({
    method: 'user.getrecenttracks',
    user,
    api_key: apiKey,
    format: 'json',
    limit: String(limit),
  });
  return `https://ws.audioscrobbler.com/2.0/?${params}`;
}

interface RawTrack {
  name?: string;
  artist?: { '#text'?: string };
  url?: string;
  date?: { uts?: string };
  '@attr'?: { nowplaying?: string };
}

/** Normalizes a user.getrecenttracks response. Errors, empty history, and malformed tracks yield []. */
export function parseRecentTracks(json: unknown, limit = 10): Track[] {
  const raw = (json as { recenttracks?: { track?: RawTrack | RawTrack[] } } | null)?.recenttracks?.track;
  if (!raw) return [];
  const tracks: Track[] = [];
  for (const t of Array.isArray(raw) ? raw : [raw]) {
    const artist = t.artist?.['#text'];
    if (!t.name || !artist || !t.url) continue;
    const uts = Number(t.date?.uts);
    tracks.push({
      name: t.name,
      artist,
      url: t.url,
      nowPlaying: t['@attr']?.nowplaying === 'true',
      playedAt: uts ? new Date(uts * 1000) : undefined,
    });
  }
  // Last.fm adds the now-playing track on top of `limit`.
  return tracks.slice(0, limit);
}

export function timeAgo(date: Date, now = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
