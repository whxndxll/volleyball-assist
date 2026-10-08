// Acentos por time. Tokens nomeados por função e por superfície, com um único
// degrau de matiz por função. O par sky/amber é o mais estável para daltonismo
// (protanopia/deuteranopia/tritanopia), então ocupa as duas primeiras posições.
// Todos os degraus foram medidos: rail/pip/accentText >= 7:1 sobre slate-950,
// label >= 5:1 sobre branco e >= 7:1 sobre slate-800, railLight >= 3:1 nos dois.
export const TEAM_COLORS = [
  {
    id: 'sky',
    rail: 'border-sky-400',
    pip: 'bg-sky-400',
    accentText: 'text-sky-400',
    ring: 'ring-sky-400',
    railLight: 'border-sky-600 dark:border-sky-400',
    label: 'text-sky-700 dark:text-sky-300',
  },
  {
    id: 'amber',
    rail: 'border-amber-400',
    pip: 'bg-amber-400',
    accentText: 'text-amber-400',
    ring: 'ring-amber-400',
    railLight: 'border-amber-600 dark:border-amber-400',
    label: 'text-amber-700 dark:text-amber-300',
  },
  {
    id: 'violet',
    rail: 'border-violet-400',
    pip: 'bg-violet-400',
    accentText: 'text-violet-400',
    ring: 'ring-violet-400',
    railLight: 'border-violet-500 dark:border-violet-400',
    label: 'text-violet-700 dark:text-violet-300',
  },
  {
    id: 'teal',
    rail: 'border-teal-400',
    pip: 'bg-teal-400',
    accentText: 'text-teal-400',
    ring: 'ring-teal-400',
    railLight: 'border-teal-600 dark:border-teal-400',
    label: 'text-teal-700 dark:text-teal-300',
  },
  {
    id: 'rose',
    rail: 'border-rose-400',
    pip: 'bg-rose-400',
    accentText: 'text-rose-400',
    ring: 'ring-rose-400',
    railLight: 'border-rose-500 dark:border-rose-400',
    label: 'text-rose-700 dark:text-rose-300',
  },
  {
    id: 'slate',
    rail: 'border-slate-300',
    pip: 'bg-slate-300',
    accentText: 'text-slate-300',
    ring: 'ring-slate-300',
    railLight: 'border-slate-600 dark:border-slate-400',
    label: 'text-slate-600 dark:text-slate-300',
  },
];

export const teamColor = (index) => TEAM_COLORS[index % TEAM_COLORS.length];

export const setsToWin = (match) => Math.floor(match.bestOf / 2) + 1;

// Estado de alerta do set corrente. Fica fora do componente porque é regra de
// jogo, não apresentação: retorna um único status para a partida inteira, o que
// evita o "Deuce" duplicado nos dois cards que a versão por time produzia.
export const matchStatus = (match) => {
  if (!match || match.finished) return null;
  const [a, b] = match.teams;
  if (!a || !b) return null;
  if (Math.max(a.points, b.points) < match.targetPoints - 1) return null;
  if (a.points === b.points) return { tone: 'neutral', label: 'Deuce' };
  const leader = a.points > b.points ? a : b;
  const isMatchPoint = leader.sets === setsToWin(match) - 1;
  return {
    tone: isMatchPoint ? 'match' : 'set',
    label: `${isMatchPoint ? 'Match point' : 'Set point'} — ${leader.name}`,
  };
};

export const setScores = (match) => (match && match.setScores) || [];

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
