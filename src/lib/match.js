export const TEAM_COLORS = [
  { border: 'border-blue-500', title: 'text-blue-600', dot: 'bg-blue-500' },
  { border: 'border-orange-500', title: 'text-orange-600', dot: 'bg-orange-500' },
  { border: 'border-emerald-500', title: 'text-emerald-600', dot: 'bg-emerald-500' },
  { border: 'border-purple-500', title: 'text-purple-600', dot: 'bg-purple-500' },
  { border: 'border-rose-500', title: 'text-rose-600', dot: 'bg-rose-500' },
  { border: 'border-teal-500', title: 'text-teal-600', dot: 'bg-teal-500' },
];

export const setsToWin = (match) => Math.floor(match.bestOf / 2) + 1;
