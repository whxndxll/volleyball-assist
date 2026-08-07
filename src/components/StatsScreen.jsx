import { ArrowLeft, BarChart3, Trophy, Users } from 'lucide-react';
import { cn } from '../lib/utils';

const MEDALS = ['text-yellow-500', 'text-slate-400', 'text-amber-700'];

export default function StatsScreen({ rachaName, stats, onBack }) {
  const { players, totalMatches, totalSets } = stats;

  return (
    <div className="p-4 pb-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 mb-6 hover:text-blue-600 transition-colors dark:text-slate-400"
      >
        <ArrowLeft size={20} /> Painel do Racha
      </button>

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Estatísticas</h1>
        <p className="text-slate-500 dark:text-slate-400">{rachaName}</p>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center dark:bg-slate-800 dark:border-slate-700">
          <Trophy size={20} className="mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
          <p className="text-2xl font-bold">{totalMatches}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Partidas</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center dark:bg-slate-800 dark:border-slate-700">
          <BarChart3 size={20} className="mx-auto mb-1 text-blue-600 dark:text-blue-400" />
          <p className="text-2xl font-bold">{totalSets}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Sets jogados</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 text-center dark:bg-slate-800 dark:border-slate-700">
          <Users size={20} className="mx-auto mb-1 text-purple-600 dark:text-purple-400" />
          <p className="text-2xl font-bold">{players.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Jogadores</p>
        </div>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>Nenhuma partida encerrada ainda.</p>
          <p className="text-sm">Finalize uma partida para gerar estatísticas!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          <div className="px-4 py-3 border-b border-slate-100 grid grid-cols-[2rem_1fr_3rem_3rem_3rem] text-xs font-semibold text-slate-400 uppercase dark:border-slate-700">
            <span>#</span>
            <span>Jogador</span>
            <span className="text-center">J</span>
            <span className="text-center">V</span>
            <span className="text-right">%</span>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {players.map((p, idx) => (
              <div
                key={p.id}
                className="px-4 py-3 grid grid-cols-[2rem_1fr_3rem_3rem_3rem] items-center text-sm"
              >
                <span className={cn('font-bold', MEDALS[idx] ?? 'text-slate-400')}>
                  {idx + 1}
                </span>
                <span className="font-medium truncate">{p.name}</span>
                <span className="text-center text-slate-500 dark:text-slate-400">{p.jogos}</span>
                <span className="text-center text-emerald-600 dark:text-emerald-400">{p.vitorias}</span>
                <span className={cn(
                  'text-right font-semibold',
                  p.aproveitamento >= 60 && 'text-emerald-600 dark:text-emerald-400',
                  p.aproveitamento >= 40 && p.aproveitamento < 60 && 'text-slate-600 dark:text-slate-300',
                  p.aproveitamento < 40 && 'text-red-500'
                )}>
                  {p.aproveitamento}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
