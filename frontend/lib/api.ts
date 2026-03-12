const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function createRoom(username: string, videoId?: string) {
  const res = await fetch(`${BASE}/api/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, videoId }),
  });
  if (!res.ok) throw new Error('Failed to create room');
  return res.json();
}

export async function joinRoom(roomId: string, username: string) {
  const res = await fetch(`${BASE}/api/rooms/${roomId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) throw new Error('Room not found or could not join');
  return res.json();
}

export async function getRoom(roomId: string) {
  const res = await fetch(`${BASE}/api/rooms/${roomId}`);
  if (!res.ok) throw new Error('Room not found');
  return res.json();
}

export function extractVideoId(input: string): string {
  // Handle full YouTube URLs
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  // Assume it's already a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();
  return input.trim();
}
