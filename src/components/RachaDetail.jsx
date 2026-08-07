import { ArrowLeft, Users, Trophy, Sun, Moon, BarChart3 } from 'lucide-react';

export default function RachaDetail({
  racha,
  activeMatch,
  matchesCount,
  onBack,
  onPlayers,
  onMatches,
  onStats,
  onNewDraw,
  darkMode,
  onToggleTheme,
}) {
  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 mb-6 hover:text-blue-600 transition-colors dark:text-slate-400"
      >
        <ArrowLeft size={20} /> Meus Rachas
      </button>

      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{racha.name}</h1>
          <p className="text-slate-500 dark:text-slate-400">O que você deseja fazer hoje?</p>
        </div>
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-blue-600 transition-colors dark:text-slate-400"
          title={darkMode ? 'Modo claro' : 'Modo escuro'}
          aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="grid gap-4">
        <button
          onClick={onPlayers}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 items-start hover:border-blue-200 transition-all dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-500"
        >
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            <Users size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">Jogadores</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie a lista de membros fixos do racha ({racha.players.length})</p>
          </div>
        </button>

        <button
          onClick={onMatches}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 items-start hover:border-emerald-200 transition-all dark:bg-slate-800 dark:border-slate-700 dark:hover:border-emerald-500"
        >
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
            <Trophy size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">Partidas</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {activeMatch
                ? 'Placar em andamento'
                : matchesCount > 0
                  ? `${matchesCount} partida(s) registrada(s)`
                  : 'Placares e histórico'}
            </p>
          </div>
        </button>

        <button
          onClick={onStats}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 items-start hover:border-purple-200 transition-all dark:bg-slate-800 dark:border-slate-700 dark:hover:border-purple-500"
        >
          <div className="bg-purple-100 p-3 rounded-xl text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
            <BarChart3 size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">Estatísticas</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Partidas, vitórias e aproveitamento por jogador.</p>
          </div>
        </button>

        <button
          onClick={onNewDraw}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 items-start hover:border-orange-200 transition-all dark:bg-slate-800 dark:border-slate-700 dark:hover:border-orange-500"
        >
          <div className="bg-orange-100 p-3 rounded-xl text-orange-600 dark:bg-orange-900/40 dark:text-orange-300">
            <Trophy size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">Novo Sorteio</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Inicie uma partida sorteando os times com quem está presente.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
