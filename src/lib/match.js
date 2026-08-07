export const TEAM_COLORS = [
  { border: 'border-blue-500', title: 'text-blue-600', dot: 'bg-blue-500', darkBorder: 'dark:border-blue-500', darkTitle: 'dark:text-blue-400', darkDot: 'dark:bg-blue-400', bg: 'bg-blue-600', darkBg: 'dark:bg-blue-700' },
  { border: 'border-orange-500', title: 'text-orange-600', dot: 'bg-orange-500', darkBorder: 'dark:border-orange-500', darkTitle: 'dark:text-orange-400', darkDot: 'dark:bg-orange-400', bg: 'bg-orange-600', darkBg: 'dark:bg-orange-700' },
  { border: 'border-emerald-500', title: 'text-emerald-600', dot: 'bg-emerald-500', darkBorder: 'dark:border-emerald-500', darkTitle: 'dark:text-emerald-400', darkDot: 'dark:bg-emerald-400', bg: 'bg-emerald-600', darkBg: 'dark:bg-emerald-700' },
  { border: 'border-purple-500', title: 'text-purple-600', dot: 'bg-purple-500', darkBorder: 'dark:border-purple-500', darkTitle: 'dark:text-purple-400', darkDot: 'dark:bg-purple-400', bg: 'bg-purple-600', darkBg: 'dark:bg-purple-700' },
  { border: 'border-rose-500', title: 'text-rose-600', dot: 'bg-rose-500', darkBorder: 'dark:border-rose-500', darkTitle: 'dark:text-rose-400', darkDot: 'dark:bg-rose-400', bg: 'bg-rose-600', darkBg: 'dark:bg-rose-700' },
  { border: 'border-teal-500', title: 'text-teal-600', dot: 'bg-teal-500', darkBorder: 'dark:border-teal-500', darkTitle: 'dark:text-teal-400', darkDot: 'dark:bg-teal-400', bg: 'bg-teal-600', darkBg: 'dark:bg-teal-700' },
];

export const setsToWin = (match) => Math.floor(match.bestOf / 2) + 1;
