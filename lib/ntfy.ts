/**
 * Realtime transport built on ntfy.sh — a free, open, no-auth pub/sub service.
 * Every room maps to an ntfy topic. Both partners publish envelopes to that topic
 * and poll the cached history (~12h) to receive each other's touches.
 */

export type TouchKind = 'heart' | 'hug' | 'kiss';
export type EnvelopeKind = TouchKind | 'ping';

export type Envelope = {
  v: 1;
  id: string;
  /** sender device code */
  s: string;
  /** sender display name */
  n: string;
  /** kind */
  k: EnvelopeKind;
  note?: string;
  t: number;
};

const BASE = 'https://ntfy.sh';

export function toTopic(room: string): string {
  const clean = room.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `lovetouch-${clean}`;
}

export function makeId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
}

export async function publish(topic: string, env: Envelope): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/${topic}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(env),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function poll(topic: string, since: number | 'all'): Promise<Envelope[]> {
  const suffix = since === 'all' ? 'all' : String(Math.max(0, Math.floor(since)));
  const res = await fetch(`${BASE}/${topic}/json?poll=1&since=${suffix}`);
  if (!res.ok) throw new Error(`poll failed: ${res.status}`);
  const text = await res.text();
  const out: Envelope[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const evt = JSON.parse(trimmed) as { event?: string; message?: unknown };
      if (evt.event !== 'message' || typeof evt.message !== 'string') continue;
      const env = JSON.parse(evt.message) as Envelope;
      if (
        env &&
        env.v === 1 &&
        typeof env.id === 'string' &&
        typeof env.s === 'string' &&
        typeof env.t === 'number' &&
        (env.k === 'heart' || env.k === 'hug' || env.k === 'kiss' || env.k === 'ping')
      ) {
        out.push(env);
      }
    } catch {
      // ignore malformed lines
    }
  }
  return out;
}
