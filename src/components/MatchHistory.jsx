import { ArrowLeft, Trophy, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { setsToWin } from '../lib/match';

export default function MatchHistory({
  rachaName,
  matches,
  onOpenMatch,
  onDeleteMatch,
  onBack,
}) {
  return (
    <div className="p-4 pb-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 mb-6 hover:text-blue-600 transition-colors dark:text-slate-400"
      >
        <ArrowLeft size={20} /> Painel do Racha
      </button>

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold">Partidas</h1>
          <p className="text-slate-500 dark:text-slate-400">{rachaName}</p>
        </div>
      </div>

      {matches.length === 0 && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <p>Nenhuma partida registrada.</p>
          <p className="text-sm">Faça um sorteio e inicie o placar!</p>
        </div>
      )}

      <div className="grid gap-3">
        {matches.map(match => {
          const winner = match.teams.find(t => t.sets >= setsToWin(match));
          return (
            <div
              key={match.id}
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between dark:bg-slate-800 dark:border-slate-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('p-2 rounded-lg shrink-0', match.finished ? 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300')}>
                  <Trophy size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {match.teams.map((t, i) => `${i > 0 ? ' x ' : ''}${t.name} ${t.sets}`)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {match.finished
                      ? winner ? `Vencedor: ${winner.name}` : 'Partida encerrada'
                      : 'Em andamento'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onOpenMatch(match)}
                  className="text-blue-600 text-sm font-medium"
                >
                  {match.finished ? 'Ver' : 'Continuar'}
                </button>
                <button
                  onClick={() => onDeleteMatch(match.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors dark:text-slate-500"
                  title="Excluir partida"
                  aria-label={`Excluir partida ${match.teams.map((t, i) => `${i > 0 ? ' x ' : ''}${t.name} ${t.sets}`)}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
