export const TEAM_COLORS = [
  { rail: 'border-sky-500', railDark: 'dark:border-sky-400', name: 'text-sky-200', label: 'text-sky-700 dark:text-sky-300', pip: 'bg-sky-400', ring: 'ring-sky-400/50' },
  { rail: 'border-amber-400', railDark: 'dark:border-amber-300', name: 'text-amber-100', label: 'text-amber-700 dark:text-amber-300', pip: 'bg-amber-300', ring: 'ring-amber-300/50' },
  { rail: 'border-violet-500', railDark: 'dark:border-violet-400', name: 'text-violet-200', label: 'text-violet-700 dark:text-violet-300', pip: 'bg-violet-400', ring: 'ring-violet-400/50' },
  { rail: 'border-teal-400', railDark: 'dark:border-teal-300', name: 'text-teal-100', label: 'text-teal-700 dark:text-teal-300', pip: 'bg-teal-300', ring: 'ring-teal-300/50' },
  { rail: 'border-rose-500', railDark: 'dark:border-rose-400', name: 'text-rose-100', label: 'text-rose-700 dark:text-rose-300', pip: 'bg-rose-400', ring: 'ring-rose-400/50' },
  { rail: 'border-slate-400', railDark: 'dark:border-slate-300', name: 'text-slate-100', label: 'text-slate-700 dark:text-slate-300', pip: 'bg-slate-300', ring: 'ring-slate-300/50' },
];

export const setsToWin = (match) => Math.floor(match.bestOf / 2) + 1;

export const matchElapsedMs = (match, now) => {
  if (!match) return 0;
  const accumulated = match.accumulatedMs || 0;
  if (match.paused || match.finished) return accumulated;
  const base = match.resumedAt || match.startedAt || match.createdAt || now;
  return accumulated + Math.max(0, now - base);
};

export const formatElapsed = (ms) => {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
