import { expect, test } from 'vitest';
import { parseRecentTracks, recentTracksUrl, timeAgo } from './lastfm';

const track = (name: string, extra: Record<string, unknown> = {}) => ({
  name,
  artist: { '#text': `${name} artist` },
  url: `https://www.last.fm/music/x/_/${name}`,
  date: { uts: '1790606967' },
  ...extra,
});

test('recentTracksUrl builds a JSON user.getrecenttracks request', () => {
  const url = new URL(recentTracksUrl('someone', 'abc123', 10));
  expect(url.origin + url.pathname).toBe('https://ws.audioscrobbler.com/2.0/');
  expect(Object.fromEntries(url.searchParams)).toEqual({
    method: 'user.getrecenttracks',
    user: 'someone',
    api_key: 'abc123',
    format: 'json',
    limit: '10',
  });
});

test('parseRecentTracks maps name, artist, url, and played time', () => {
  const [first] = parseRecentTracks({ recenttracks: { track: [track('Song')] } });
  expect(first).toEqual({
    name: 'Song',
    artist: 'Song artist',
    url: 'https://www.last.fm/music/x/_/Song',
    nowPlaying: false,
    playedAt: new Date(1790606967 * 1000),
  });
});

test('parseRecentTracks flags the now-playing track and caps the list', () => {
  // Last.fm returns the now-playing track on top of `limit`, so 11 can come back for 10.
  const now = { name: 'Live', artist: { '#text': 'A' }, url: 'u', '@attr': { nowplaying: 'true' } };
  const many = Array.from({ length: 10 }, (_, i) => track(`T${i}`));
  const tracks = parseRecentTracks({ recenttracks: { track: [now, ...many] } }, 10);
  expect(tracks).toHaveLength(10);
  expect(tracks[0]).toMatchObject({ name: 'Live', nowPlaying: true, playedAt: undefined });
});

test('parseRecentTracks accepts a single track object', () => {
  expect(parseRecentTracks({ recenttracks: { track: track('Solo') } })).toHaveLength(1);
});

test('parseRecentTracks returns [] for errors, empty history, and junk', () => {
  expect(parseRecentTracks({ error: 10, message: 'Invalid API key' })).toEqual([]);
  expect(parseRecentTracks({ recenttracks: { track: [] } })).toEqual([]);
  expect(parseRecentTracks(null)).toEqual([]);
  expect(parseRecentTracks({ recenttracks: { track: [{ name: 'no artist' }] } })).toEqual([]);
});

test('timeAgo reads naturally from minutes to days, then falls back to a date', () => {
  const now = new Date('2026-09-28T15:00:00Z');
  const ago = (ms: number) => timeAgo(new Date(now.getTime() - ms), now);
  expect(ago(20_000)).toBe('Just now');
  expect(ago(12 * 60_000)).toBe('12m ago');
  expect(ago(3 * 3_600_000)).toBe('3h ago');
  expect(ago(2 * 86_400_000)).toBe('2d ago');
  expect(ago(10 * 86_400_000)).toBe('Sep 18');
});
