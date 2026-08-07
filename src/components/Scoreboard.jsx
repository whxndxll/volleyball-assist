import { useRef } from 'react';
import { ArrowLeft, Flag, RotateCcw, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { TEAM_COLORS, setsToWin } from '../lib/match';

const DRAG_THRESHOLD = 24;

export default function Scoreboard({
  rachaName,
  match,
  winner,
  onAddPoint,
  onRemovePoint,
  onFinishMatch,
  onResetMatch,
  onFinalize,
  onBack,
}) {
  const gesture = useRef(null);
  const targetSets = setsToWin(match);

  const [t0, t1] = match.teams;
  const diff = Math.abs(t0.points - t1.points);
  const maxPoints = Math.max(t0.points, t1.points);
  const inEndRange = maxPoints >= match.targetPoints - 1;
  const leader = t0.points > t1.points ? t0 : t1;

  const statusFor = (team) => {
    if (match.finished) return null;
    if (!inEndRange) return null;
    if (diff === 0) return 'Deuce';
    if (team.id !== leader.id) return null;
    return leader.sets === targetSets - 1 ? 'Match point!' : 'Set point!';
  };

  const beginGesture = (e) => {
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // ambientes sem pointer capture (ex.: testes) podem lançar aqui
    }
    gesture.current = { startY: e.clientY, moved: false };
  };

  const moveGesture = (e, teamId) => {
    const g = gesture.current;
    if (!g) return;
    const delta = e.clientY - g.startY;
    if (delta > DRAG_THRESHOLD) {
      g.moved = true;
      g.startY = e.clientY;
      onRemovePoint(teamId);
    } else if (delta < -DRAG_THRESHOLD) {
      g.moved = true;
      g.startY = e.clientY;
      onAddPoint(teamId);
    }
  };

  const endGesture = (e, teamId) => {
    const g = gesture.current;
    gesture.current = null;
    if (g && !g.moved && Math.abs(e.clientY - g.startY) < 8) {
      onAddPoint(teamId);
    }
  };

  const handleKey = (e, teamId) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault();
      onAddPoint(teamId);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onRemovePoint(teamId);
    }
  };

  return (
    <div className="p-4 pb-32 flex flex-col min-h-screen">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 mb-4 hover:text-blue-600 transition-colors dark:text-slate-400"
      >
        <ArrowLeft size={20} /> Painel do Racha
      </button>

      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Placar</h1>
          <p className="text-slate-500 dark:text-slate-400">{rachaName}</p>
        </div>
        <div className="text-right text-sm text-slate-500 dark:text-slate-400">
          Melhor de {match.bestOf}
          <p className="text-xs">até {match.targetPoints} pts</p>
        </div>
      </header>

      {match.finished && winner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-4 text-center dark:bg-emerald-950/60 dark:border-emerald-900 dark:text-emerald-300">
          <p className="font-bold text-lg">{winner.name} venceu!</p>
          <p className="text-sm">
            {match.teams.map(t => `${t.name} ${t.sets}`).join(' · ')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 flex-1 content-stretch">
        {match.teams.map((team, idx) => {
          const color = TEAM_COLORS[idx % TEAM_COLORS.length];
          const status = statusFor(team);
          return (
            <div
              key={team.id}
              role="button"
              tabIndex={0}
              aria-label={`Pontuar ${team.name}`}
              onPointerDown={beginGesture}
              onPointerMove={(e) => moveGesture(e, team.id)}
              onPointerUp={(e) => endGesture(e, team.id)}
              onKeyDown={(e) => handleKey(e, team.id)}
              onContextMenu={(e) => e.preventDefault()}
              className={cn(
                'rounded-3xl shadow-lg touch-none select-none flex flex-col items-center justify-center gap-2 p-4',
                'landscape:py-6',
                match.finished && 'opacity-90',
                color.bg,
                color.darkBg
              )}
            >
              <div className="flex gap-1.5" aria-label={`${team.sets} sets`}>
                {Array.from({ length: targetSets }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-colors',
                      i < team.sets ? 'bg-white' : 'bg-white/30'
                    )}
                  />
                ))}
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base truncate max-w-full px-1">
                {team.name}
              </h3>
              <p
                className={cn(
                  'font-black text-white tabular-nums leading-none',
                  'text-7xl sm:text-8xl landscape:text-9xl'
                )}
              >
                {team.points}
              </p>
              {status ? (
                <p className="text-white/90 text-xs font-bold uppercase tracking-wide bg-white/20 rounded-full px-3 py-0.5">
                  {status}
                </p>
              ) : (
                <p className="text-white/60 text-xs font-medium">toque para pontuar</p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center dark:text-slate-500">
        Toque no número para pontuar · arraste para baixo para desfazer
      </p>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 dark:bg-slate-900/80 dark:border-slate-700">
        <div className="max-w-md mx-auto">
          {match.finished ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onResetMatch}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} /> Zerar placar
              </button>
              <button
                onClick={onFinalize}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Check size={18} /> Finalizar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={onFinishMatch}
                className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 dark:bg-slate-700"
              >
                <Flag size={18} /> Encerrar
              </button>
              <button
                onClick={onResetMatch}
                className="w-full bg-slate-200 text-slate-700 py-4 rounded-xl font-bold transition-all dark:bg-slate-700 dark:text-slate-300"
                title="Zerar placar"
              >
                Zerar
              </button>
              <button
                onClick={onBack}
                className="w-full bg-white border border-slate-200 text-slate-600 py-4 rounded-xl font-bold transition-all dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300"
              >
                Voltar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
