import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ntfy from './ntfy';
import type { Envelope, TouchKind } from './ntfy';
import { hapticReceived, hapticSent } from './haptics';
import { darkPalette, lightPalette } from './theme';

const STORAGE_KEY = 'lovetouch.state.v1';
const MAX_MEMORIES = 150;
const POLL_MS = 2500;
const PING_EVERY_TICKS = 10; // ~25s heartbeat
const ONLINE_MS = 100000;
const SEEN_CAP = 600;

export type Memory = {
  id: string;
  kind: TouchKind;
  dir: 'sent' | 'recv';
  from: string;
  note?: string;
  t: number;
  pending?: boolean;
};

export type ThemePref = 'system' | 'light' | 'dark';
type Conn = 'connecting' | 'live' | 'offline';

export type Incoming = { kind: TouchKind; note?: string; from: string; t: number; seq: number };

type StoreValue = {
  hydrated: boolean;
  room: string | null;
  deviceCode: string;
  name: string;
  partnerName: string;
  memories: Memory[];
  themePref: ThemePref;
  hapticsOn: boolean;
  conn: Conn;
  online: boolean;
  partnerLastSeen: number | null;
  lastIncoming: Incoming | null;
  createRoom: () => Promise<boolean>;
  joinRoom: (rawCode: string, name: string) => Promise<boolean>;
  leaveRoom: () => void;
  setName: (v: string) => void;
  setPartnerName: (v: string) => void;
  setThemePref: (v: ThemePref) => void;
  setHapticsOn: (v: boolean) => void;
  sendTouch: (kind: TouchKind, note?: string) => Promise<boolean>;
  testSignal: () => Promise<boolean>;
  refreshNow: () => Promise<void>;
  deleteMemory: (id: string) => void;
  clearMemories: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(): string {
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function makeDeviceCode(): string {
  return `D${randomCode().slice(0, 7)}`;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [deviceCode, setDeviceCode] = useState('');
  const [name, setNameState] = useState('');
  const [partnerName, setPartnerNameState] = useState('');
  const [room, setRoom] = useState<string | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [themePref, setThemePrefState] = useState<ThemePref>('system');
  const [hapticsOn, setHapticsOnState] = useState(true);
  const [conn, setConn] = useState<Conn>('connecting');
  const [online, setOnline] = useState(false);
  const [partnerLastSeen, setPartnerLastSeen] = useState<number | null>(null);
  const [lastIncoming, setLastIncoming] = useState<Incoming | null>(null);

  const roomRef = useRef<string | null>(null);
  const deviceRef = useRef('');
  const nameRef = useRef('');
  const seenRef = useRef<Set<string>>(new Set());
  const pendingRef = useRef<Map<string, Envelope>>(new Map());
  const lastPollSecRef = useRef(0);
  const runningRef = useRef(false);
  const seqRef = useRef(0);
  const failCountRef = useRef(0);

  roomRef.current = room;
  deviceRef.current = deviceCode;
  nameRef.current = name;

  // ---------- hydration ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (alive && raw) {
          const parsed = JSON.parse(raw) as Partial<StoreValue> & { deviceCode?: string };
          if (parsed.deviceCode) setDeviceCode(parsed.deviceCode);
          if (typeof parsed.name === 'string') setNameState(parsed.name);
          if (typeof parsed.partnerName === 'string') setPartnerNameState(parsed.partnerName);
          if (typeof parsed.room === 'string' && parsed.room) setRoom(parsed.room);
          if (Array.isArray(parsed.memories)) setMemories(parsed.memories.slice(0, MAX_MEMORIES));
          if (parsed.themePref === 'system' || parsed.themePref === 'light' || parsed.themePref === 'dark') {
            setThemePrefState(parsed.themePref);
          }
          if (typeof parsed.hapticsOn === 'boolean') setHapticsOnState(parsed.hapticsOn);
        }
      } catch {
        // corrupted storage — start fresh
      }
      if (alive) {
        setDeviceCode((prev) => prev || makeDeviceCode());
        setHydrated(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---------- persistence ----------
  useEffect(() => {
    if (!hydrated) return;
    const payload = JSON.stringify({
      deviceCode,
      name,
      partnerName,
      room,
      memories: memories.slice(0, MAX_MEMORIES),
      themePref,
      hapticsOn,
    });
    AsyncStorage.setItem(STORAGE_KEY, payload).catch(() => {});
  }, [hydrated, deviceCode, name, partnerName, room, memories, themePref, hapticsOn]);

  const remember = useCallback((env: Envelope) => {
    seenRef.current.add(env.id);
    if (seenRef.current.size > SEEN_CAP) {
      const keep = Array.from(seenRef.current).slice(-Math.floor(SEEN_CAP / 2));
      seenRef.current = new Set(keep);
    }
  }, []);

  const addMemory = useCallback((m: Memory) => {
    setMemories((prev) => [m, ...prev].slice(0, MAX_MEMORIES));
  }, []);

  // ---------- sync ----------
  const publishEnvelope = useCallback(
    async (env: Envelope, track: boolean): Promise<boolean> => {
      const r = roomRef.current;
      if (!r) return false;
      const ok = await ntfy.publish(ntfy.toTopic(r), env);
      if (ok) {
        setConn('live');
        failCountRef.current = 0;
        if (track) {
          setMemories((prev) => prev.map((m) => (m.id === env.id ? { ...m, pending: false } : m)));
        }
      } else {
        failCountRef.current += 1;
        if (failCountRef.current >= 2) setConn('offline');
      }
      return ok;
    },
    [],
  );

  const runPoll = useCallback(async () => {
    const r = roomRef.current;
    if (!r || runningRef.current) return;
    runningRef.current = true;
    try {
      const topic = ntfy.toTopic(r);
      const since = lastPollSecRef.current > 0 ? lastPollSecRef.current - 30 : 'all';
      const events = await ntfy.poll(topic, since);
      lastPollSecRef.current = Math.floor(Date.now() / 1000);
      failCountRef.current = 0;
      setConn('live');

      events.sort((a, b) => a.t - b.t);
      for (const env of events) {
        if (seenRef.current.has(env.id)) continue;
        remember(env);
        if (env.s === deviceRef.current) continue;
        setPartnerLastSeen((prev) => (prev === null || env.t > prev ? env.t : prev));
        if (env.k === 'ping') continue;
        addMemory({
          id: env.id,
          kind: env.k,
          dir: 'recv',
          from: env.n || 'പ്രിയപ്പെട്ടയാൾ',
          note: env.note,
          t: env.t,
        });
        if (hapticsRef.current) hapticReceived();
        seqRef.current += 1;
        setLastIncoming({
          kind: env.k,
          note: env.note,
          from: env.n || 'പ്രിയപ്പെട്ടയാൾ',
          t: env.t,
          seq: seqRef.current,
        });
      }

      // retry anything that failed to send earlier
      if (pendingRef.current.size > 0) {
        const retries = Array.from(pendingRef.current.values()).slice(0, 3);
        for (const env of retries) {
          const ok = await publishEnvelope(env, true);
          if (ok) pendingRef.current.delete(env.id);
        }
      }
    } catch {
      failCountRef.current += 1;
      if (failCountRef.current >= 2) setConn('offline');
    } finally {
      setOnline(
        partnerLastSeenRef.current !== null && Date.now() - partnerLastSeenRef.current < ONLINE_MS,
      );
      runningRef.current = false;
    }
  }, [addMemory, publishEnvelope, remember]);

  const partnerLastSeenRef = useRef<number | null>(null);
  partnerLastSeenRef.current = partnerLastSeen;
  const hapticsRef = useRef(true);
  hapticsRef.current = hapticsOn;

  const sendPing = useCallback(async () => {
    const r = roomRef.current;
    if (!r) return;
    const env: Envelope = {
      v: 1,
      id: ntfy.makeId(),
      s: deviceRef.current,
      n: nameRef.current || 'പ്രിയപ്പെട്ടയാൾ',
      k: 'ping',
      t: Date.now(),
    };
    remember(env);
    await publishEnvelope(env, false);
  }, [publishEnvelope, remember]);

  useEffect(() => {
    if (!hydrated || !room) return;
    lastPollSecRef.current = 0;
    seenRef.current.clear();
    pendingRef.current.clear();
    failCountRef.current = 0;
    setConn('connecting');
    let ticks = 0;
    const run = () => {
      ticks += 1;
      runPoll();
      if (ticks % PING_EVERY_TICKS === 0) sendPing();
    };
    run();
    const interval = setInterval(run, POLL_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [hydrated, room, runPoll, sendPing]);

  // ---------- actions ----------
  const joinRoom = useCallback(
    async (rawCode: string, display: string): Promise<boolean> => {
      const code = normalizeCode(rawCode);
      if (code.length < 4) return false;
      const cleanName = display.trim() || 'പ്രിയപ്പെട്ടയാൾ';
      setNameState(cleanName);
      nameRef.current = cleanName;
      setRoom(code);
      roomRef.current = code;
      setPartnerLastSeen(null);
      partnerLastSeenRef.current = null;
      setLastIncoming(null);
      setMemories([]);
      const env: Envelope = {
        v: 1,
        id: ntfy.makeId(),
        s: deviceRef.current,
        n: cleanName,
        k: 'ping',
        t: Date.now(),
      };
      remember(env);
      const ok = await publishEnvelope(env, false);
      if (ok) lastPollSecRef.current = Math.floor(Date.now() / 1000);
      return ok;
    },
    [publishEnvelope, remember],
  );

  const createRoom = useCallback(async (): Promise<boolean> => {
    return joinRoom(randomCode(), nameRef.current || 'പ്രിയപ്പെട്ടയാൾ');
  }, [joinRoom]);

  const leaveRoom = useCallback(() => {
    setRoom(null);
    roomRef.current = null;
    setMemories([]);
    setPartnerLastSeen(null);
    partnerLastSeenRef.current = null;
    setPartnerNameState('');
    setLastIncoming(null);
    setConn('connecting');
    setOnline(false);
    seenRef.current.clear();
    pendingRef.current.clear();
    lastPollSecRef.current = 0;
  }, []);

  const sendTouch = useCallback(
    async (kind: TouchKind, note?: string): Promise<boolean> => {
      const r = roomRef.current;
      if (!r) return false;
      const trimmed = note?.trim() ? note.trim().slice(0, 60) : undefined;
      const env: Envelope = {
        v: 1,
        id: ntfy.makeId(),
        s: deviceRef.current,
        n: nameRef.current || 'പ്രിയപ്പെട്ടയാൾ',
        k: kind,
        t: Date.now(),
        ...(trimmed ? { note: trimmed } : {}),
      };
      remember(env);
      addMemory({ id: env.id, kind, dir: 'sent', from: env.n, note: trimmed, t: env.t, pending: true });
      if (hapticsRef.current) hapticSent(kind);
      const ok = await publishEnvelope(env, true);
      if (!ok) pendingRef.current.set(env.id, env);
      return ok;
    },
    [addMemory, publishEnvelope, remember],
  );

  const testSignal = useCallback(async (): Promise<boolean> => {
    if (!roomRef.current) return false;
    const env: Envelope = {
      v: 1,
      id: ntfy.makeId(),
      s: deviceRef.current,
      n: nameRef.current || 'പ്രിയപ്പെട്ടയാൾ',
      k: 'ping',
      t: Date.now(),
    };
    remember(env);
    return publishEnvelope(env, false);
  }, [publishEnvelope, remember]);

  const refreshNow = useCallback(async () => {
    await runPoll();
  }, [runPoll]);

  const deleteMemory = useCallback((id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearMemories = useCallback(() => {
    setMemories([]);
  }, []);

  const setName = useCallback((v: string) => setNameState(v), []);
  const setPartnerName = useCallback((v: string) => setPartnerNameState(v), []);
  const setThemePref = useCallback((v: ThemePref) => setThemePrefState(v), []);
  const setHapticsOn = useCallback((v: boolean) => setHapticsOnState(v), []);

  const value = useMemo<StoreValue>(
    () => ({
      hydrated,
      room,
      deviceCode,
      name,
      partnerName,
      memories,
      themePref,
      hapticsOn,
      conn,
      online,
      partnerLastSeen,
      lastIncoming,
      createRoom,
      joinRoom,
      leaveRoom,
      setName,
      setPartnerName,
      setThemePref,
      setHapticsOn,
      sendTouch,
      testSignal,
      refreshNow,
      deleteMemory,
      clearMemories,
    }),
    [
      hydrated,
      room,
      deviceCode,
      name,
      partnerName,
      memories,
      themePref,
      hapticsOn,
      conn,
      online,
      partnerLastSeen,
      lastIncoming,
      createRoom,
      joinRoom,
      leaveRoom,
      setName,
      setPartnerName,
      setThemePref,
      setHapticsOn,
      sendTouch,
      testSignal,
      refreshNow,
      deleteMemory,
      clearMemories,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export function useTheme() {
  const { themePref } = useStore();
  const scheme = useColorScheme();
  const mode: 'light' | 'dark' =
    themePref === 'system' ? (scheme === 'dark' ? 'dark' : 'light') : themePref;
  const palette = mode === 'dark' ? darkPalette : lightPalette;
  return { colors: palette, dark: mode === 'dark', mode };
}
