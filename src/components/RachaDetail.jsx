import { ArrowLeft, Users, Sun, Moon, Dices, Play } from 'lucide-react';
import { cn } from '../lib/utils';

export default function RachaDetail({
  racha,
  activeMatch,
  onBack,
  onPlayers,
  onPlacar,
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
        {activeMatch && (
          <button
            onClick={onPlacar}
            className="bg-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-200 flex flex-col gap-3 items-start text-left hover:bg-emerald-700 transition-all dark:shadow-none dark:bg-emerald-700 dark:hover:bg-emerald-600"
          >
            <div className="bg-white/20 p-3 rounded-xl text-white">
              <Play size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                {activeMatch.paused ? 'Placar em pausa' : 'Placar em andamento'}
                {!activeMatch.finished && (
                  <span
                    className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-full',
                      activeMatch.paused
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/20 text-white animate-pulse'
                    )}
                  >
                    {activeMatch.paused ? 'EM PAUSA' : 'AO VIVO'}
                  </span>
                )}
              </h3>
              <p className="text-sm text-emerald-50">
                {activeMatch.teams.map(t => `${t.name} ${t.sets}`).join(' · ')}
              </p>
            </div>
          </button>
        )}

        <button
          onClick={onPlayers}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 items-start hover:border-blue-200 transition-all dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-500"
        >
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            <Users size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">Jogadores</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Lista de presença fixa do racha ({racha.players.length})</p>
          </div>
        </button>

        <button
          onClick={onNewDraw}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 items-start hover:border-orange-200 transition-all dark:bg-slate-800 dark:border-slate-700 dark:hover:border-orange-500"
        >
          <div className="bg-orange-100 p-3 rounded-xl text-orange-600 dark:bg-orange-900/40 dark:text-orange-300">
            <Dices size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">Novo Sorteio</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sorteie os times com quem está presente hoje.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
