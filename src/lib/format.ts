/** Naira + date formatting helpers (locale-independent, deterministic). */

const group = (n: number): string => {
  const neg = n < 0;
  const abs = Math.round(Math.abs(n));
  const s = abs.toString();
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += ',';
    out += s[i];
  }
  return (neg ? '-' : '') + out;
};

/** ₦84,200 */
export const money = (n: number): string => `₦${group(n)}`;

/** ₦84,200.00 */
export const money2 = (n: number): string => `₦${group(Math.floor(n))}.${Math.abs(Math.round((n % 1) * 100)).toString().padStart(2, '0')}`;

/** "₦140k" compact form used in goal rows */
export const moneyK = (n: number): string => {
  if (Math.abs(n) >= 1000000) return `₦${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
  if (Math.abs(n) >= 1000) {
    const k = n / 1000;
    return `₦${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return money(n);
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const parseDate = (iso: string): Date => new Date(iso);

export const toISO = (d: Date): string => d.toISOString();

/** Sep 3, 2026 */
export const fmtDate = (iso: string): string => {
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/** Sep 3 */
export const fmtDateShort = (iso: string): string => {
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

/** Sep 3, 9:41 AM */
export const fmtDateTime = (iso: string): string => {
  const d = parseDate(iso);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 === 0 ? 12 : h % 12;
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${fmtDateShort(iso)}, ${h}:${m} ${ampm}`;
};

/** Thursday, Sep 3 */
export const fmtWeekdayDate = (d: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${days[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
};

export const daysBetween = (from: Date, to: Date): number =>
  Math.round((to.getTime() - from.getTime()) / 86400000);

export const daysUntil = (iso: string, from: Date = new Date()): number =>
  Math.max(0, daysBetween(from, parseDate(iso)));

/** "2h" / "1d" / "3d" relative time */
export const relTime = (iso: string, now: Date = new Date()): string => {
  const mins = Math.max(0, Math.round((now.getTime() - parseDate(iso).getTime()) / 60000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const monthKey = (d: Date): string => `${d.getFullYear()}-${d.getMonth()}`;

export const monthName = (d: Date): string => MONTHS[d.getMonth()];
