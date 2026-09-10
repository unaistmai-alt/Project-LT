const MONTHS = [
  'ജനുവരി',
  'ഫെബ്രുവരി',
  'മാർച്ച്',
  'ഏപ്രിൽ',
  'മേയ്',
  'ജൂൺ',
  'ജൂലൈ',
  'ഓഗസ്റ്റ്',
  'സെപ്റ്റംബർ',
  'ഒക്ടോബർ',
  'നവംബർ',
  'ഡിസംബർ',
];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function timeAgo(t: number, now = Date.now()): string {
  const diff = Math.max(0, now - t);
  const sec = Math.floor(diff / 1000);
  if (sec < 8) return 'ഇപ്പോൾ തന്നെ';
  if (sec < 60) return `${sec} സെക്കൻഡ് മുൻപ്`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} മിനിറ്റ് മുൻപ്`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} മണിക്കൂർ മുൻപ്`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'ഇന്നലെ';
  if (day < 7) return `${day} ദിവസം മുൻപ്`;
  return dayLabel(t);
}

export function dayLabel(t: number, now = Date.now()): string {
  const day = startOfDay(t);
  const today = startOfDay(now);
  if (day === today) return 'ഇന്ന്';
  if (day === today - 86400000) return 'ഇന്നലെ';
  const d = new Date(t);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function clockTime(t: number): string {
  const d = new Date(t);
  const h = d.getHours();
  const m = d.getMinutes();
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(m)} ${suffix}`;
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(a) === startOfDay(b);
}

export function todayStart(now = Date.now()): number {
  return startOfDay(now);
}

/** Consecutive-day streak of touches (ending today or yesterday). */
export function streakOf(timestamps: number[], now = Date.now()): number {
  if (timestamps.length === 0) return 0;
  const days = new Set(timestamps.map((t) => startOfDay(t)));
  let cursor = startOfDay(now);
  if (!days.has(cursor)) cursor -= 86400000;
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= 86400000;
  }
  return streak;
}

export function prettyCode(code: string): string {
  const c = code.toUpperCase();
  if (c.length <= 4) return c;
  return `${c.slice(0, 4)}-${c.slice(4)}`;
}
