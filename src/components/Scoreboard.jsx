import { ArrowLeft, Minus, Plus, RotateCcw, Flag } from 'lucide-react';
import { cn } from '../lib/utils';
import { TEAM_COLORS, setsToWin } from '../lib/match';

export default function Scoreboard({
  rachaName,
  match,
  winner,
  onAddPoint,
  onAddSet,
  onFinishMatch,
  onResetMatch,
  onBack,
}) {
  return (
    <div className="p-4 pb-32">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 mb-6 hover:text-blue-600 transition-colors dark:text-slate-400"
      >
        <ArrowLeft size={20} /> Partidas
      </button>

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Placar</h1>
        <p className="text-slate-500 dark:text-slate-400">{rachaName}</p>
      </header>

      {match.finished && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-6 text-center dark:bg-emerald-950/60 dark:border-emerald-900 dark:text-emerald-300">
          <p className="font-bold">Partida encerrada</p>
          {winner && <p className="text-sm">{winner.name} venceu!</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        {match.teams.map((team, idx) => {
          const color = TEAM_COLORS[idx % TEAM_COLORS.length];
          const isWinner = match.finished && team.sets >= setsToWin(match);
          const isSetPoint = !match.finished && team.points >= match.targetPoints;
          return (
            <div key={team.id} className={cn('bg-white p-4 rounded-2xl shadow-sm border-t-4 dark:bg-slate-800', color.border, color.darkBorder)}>
              <h3 className={cn('font-bold mb-1 text-center', color.title, color.darkTitle)}>{team.name}</h3>
              <p className={cn('text-5xl font-bold text-center my-2', isSetPoint && 'text-emerald-600 dark:text-emerald-400')}>{team.points}</p>
              {isSetPoint && (
                <p className="text-center text-xs font-semibold text-emerald-600 mb-1 dark:text-emerald-400">Set point!</p>
              )}
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={() => onAddPoint(team.id, -1)}
                  className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-40 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  disabled={match.finished}
                >
                  <Minus size={18} />
                </button>
                <button
                  onClick={() => onAddPoint(team.id, 1)}
                  className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40"
                  disabled={match.finished}
                >
                  <Plus size={18} />
                </button>
              </div>
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-400 uppercase dark:text-slate-500">Sets</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddSet(team.id, -1)}
                    className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-40 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    disabled={match.finished}
                  >
                    <Minus size={14} />
                  </button>
                  <span className={cn('font-bold w-6 text-center', isWinner ? 'text-emerald-600 dark:text-emerald-400' : '')}>{team.sets}</span>
                  <button
                    onClick={() => onAddSet(team.id, 1)}
                    className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-40 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    disabled={match.finished}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 mb-6 text-center dark:text-slate-500">
        Jogo até {match.targetPoints} pontos · melhor de {match.bestOf} ({setsToWin(match)} sets para vencer)
      </p>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 dark:bg-slate-900/80 dark:border-slate-700">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
          {match.finished ? (
            <button
              onClick={() => onResetMatch()}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} /> Zerar placar
            </button>
          ) : (
            <button
              onClick={() => onFinishMatch()}
              className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Flag size={18} /> Encerrar partida
            </button>
          )}
          <button
            onClick={onBack}
            className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-xl font-bold transition-all dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
