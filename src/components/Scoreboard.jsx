import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Pause, RotateCcw, Square, Timer, Trophy, Undo2, Maximize } from 'lucide-react';
import { cn } from '../lib/utils';
import { TEAM_COLORS, setsToWin, matchElapsedMs, formatElapsed } from '../lib/match';

const DRAG_THRESHOLD = 24;

function ScoreboardBody({
  match,
  winner,
  onAddPoint,
  onRemovePoint,
  onUndoLastPoint,
  onPauseMatch,
  onResetMatch,
  onStopMatch,
  onBack,
  onEditTeam,
  onFullscreen,
}) {
  const gesture = useRef(null);
  const targetSets = setsToWin(match);

  const [t0, t1] = match.teams;
  const diff = Math.abs(t0.points - t1.points);
  const maxPoints = Math.max(t0.points, t1.points);
  const inEndRange = maxPoints >= match.targetPoints - 1;
  const leader = t0.points > t1.points ? t0 : t1;

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (match.finished || match.paused) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [match.finished, match.paused]);

  const elapsedMs = matchElapsedMs(match, now);

  const statusFor = (team) => {
    if (match.finished) return null;
    if (!inEndRange) return null;
    if (diff === 0) return 'Deuce';
    if (team.id !== leader.id) return null;
    return leader.sets === targetSets - 1 ? 'Match point!' : 'Set point!';
  };

  const beginGesture = (e) => {
    if (e.target.closest('button, input')) return;
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // ambientes sem pointer capture (ex.: testes) podem lançar aqui
    }
    gesture.current = { startY: e.clientY, moved: false };
  };

  const moveGesture = (e, teamId) => {
    const g = gesture.current;
    if (!g || g.moved) return;
    const delta = e.clientY - g.startY;
    if (delta > DRAG_THRESHOLD) {
      g.moved = true;
      onRemovePoint(teamId);
    } else if (delta < -DRAG_THRESHOLD) {
      g.moved = true;
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
    <div className="h-full w-full flex flex-col p-3 sm:p-4 gap-2">
      <header className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors dark:text-slate-400 shrink-0"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-bold leading-tight">Placar</h1>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Timer
              size={14}
              className={cn('transition-colors', match.finished || match.paused ? 'text-slate-400' : 'text-blue-500')}
            />
            <span className="font-bold tabular-nums text-sm">{formatElapsed(elapsedMs)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
              Melhor de {match.bestOf} · até {match.targetPoints} pts
            </div>
            {onFullscreen && (
              <button
                onClick={onFullscreen}
                className="text-slate-400 hover:text-blue-600 transition-colors dark:text-slate-500"
                aria-label="Tela cheia e paisagem"
                title="Tela cheia e paisagem"
              >
                <Maximize size={16} />
              </button>
            )}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 flex-1 content-stretch min-h-0">
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
                'sm:py-6',
                'bg-slate-950 dark:bg-slate-950 text-white border border-slate-800 border-t-4',
                color.rail,
                color.railDark,
                !match.finished && t0.points !== t1.points && team.id === leader.id && `ring-2 ${color.ring}`,
                match.finished && 'opacity-90'
              )}
            >
              <div className="flex gap-1.5" aria-label={`${team.sets} sets`}>
                {Array.from({ length: targetSets }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-3 h-3 rounded-full transition-colors',
                      i < team.sets ? color.pip : 'border border-white/40 bg-transparent'
                    )}
                  />
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditTeam(team);
                }}
                className={cn('font-bold text-sm sm:text-base truncate max-w-full px-1', color.name)}
                title="Toque para renomear"
                aria-label={`Renomear ${team.name}`}
              >
                {team.name}
              </button>
              <div className="w-full rounded-2xl bg-black/40 px-2 py-1 text-center">
                <p
                  className={cn(
                    'font-black text-white tabular-nums leading-none tracking-tight drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]',
                    'text-7xl sm:text-8xl md:text-9xl'
                  )}
                >
                  {team.points}
                </p>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onRemovePoint(team.id); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-full bg-white/15 text-white text-xl font-bold flex items-center justify-center hover:bg-white/25 transition-colors"
                  aria-label={`Remover ponto ${team.name}`}
                >
                  −
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onAddPoint(team.id); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  className="w-12 h-12 rounded-full bg-white/25 text-white text-xl font-bold flex items-center justify-center hover:bg-white/35 transition-colors"
                  aria-label={`Adicionar ponto ${team.name}`}
                >
                  +
                </button>
              </div>
              {status && (
                <p className="bg-amber-300 text-slate-950 text-xs font-black uppercase tracking-wide rounded-full px-3 py-0.5">
                  {status}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {match.finished ? (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div
            role="dialog"
            aria-label="Resultado da partida"
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
          >
            <div className="mx-auto mb-4 bg-amber-100 dark:bg-amber-900/40 p-4 rounded-full w-fit text-amber-500">
              <Trophy size={40} />
            </div>
            <h2 className="text-2xl font-black mb-1">
              {winner ? `${winner.name} venceu!` : 'Partida encerrada'}
            </h2>
            <p className="text-slate-500 mb-6 dark:text-slate-400">
              {match.teams.map(t => `${t.name} ${t.sets}`).join(' · ')}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={onResetMatch}
                className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
              >
                <RotateCcw size={18} /> Zerar placar
              </button>
              <button
                onClick={onBack}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:border-blue-200 hover:text-blue-600 transition-colors dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300"
              >
                <ArrowLeft size={18} /> Voltar
              </button>
            </div>
            <button
              onClick={onStopMatch}
              className="flex items-center justify-center gap-2 w-full bg-rose-50 text-rose-600 border border-rose-200 py-3 rounded-xl font-bold hover:bg-rose-100 transition-colors dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/50"
            >
              <Square size={16} fill="currentColor" /> Parar placar
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <div className="mx-auto flex items-center justify-center gap-3">
            <button
              onClick={onResetMatch}
              className="w-12 h-12 flex items-center justify-center bg-slate-200 text-slate-700 rounded-xl font-bold transition-all dark:bg-slate-700 dark:text-slate-300"
              aria-label="Zerar"
              title="Zerar"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={onUndoLastPoint}
              className="w-12 h-12 flex items-center justify-center bg-amber-100 text-amber-700 rounded-xl font-bold transition-all dark:bg-amber-900/30 dark:text-amber-300"
              aria-label="Desfazer último ponto"
              title="Desfazer"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={onPauseMatch}
              className="w-12 h-12 flex items-center justify-center bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all dark:bg-slate-700"
              aria-label="Pausar"
              title="Pausar"
            >
              <Pause size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Scoreboard(props) {
  const [isPortrait, setIsPortrait] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia('(orientation: portrait)').matches
  );
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingTeamName, setEditingTeamName] = useState('');

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(orientation: portrait)');
    const onChange = (e) => setIsPortrait(e.matches);
    mql.addEventListener('change', onChange);
    return () => {
      mql.removeEventListener('change', onChange);
      const orientation = screen.orientation;
      if (orientation && typeof orientation.unlock === 'function') {
        orientation.unlock();
      }
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const handleFullscreen = async () => {
    try {
      if (document.fullscreenEnabled && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // fullscreen negado (ex.: iOS Safari) — segue com rotação CSS
    }
    const orientation = screen.orientation;
    if (orientation && typeof orientation.lock === 'function') {
      try {
        await orientation.lock('landscape');
      } catch {
        // iOS ou sem fullscreen — segue com rotação CSS
      }
    }
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setEditingTeamName(team.name);
  };

  const saveTeamName = () => {
    if (editingTeam) props.onRenameTeam?.(editingTeam.id, editingTeamName);
    setEditingTeam(null);
  };

  if (isPortrait) {
    // Renderiza já em paisagem: gira o conteúdo 90° sem depender do aparelho.
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: '100dvh',
            height: '100dvw',
            transform: 'translate(-50%, -50%) rotate(90deg)',
          }}
        >
          <ScoreboardBody {...props} onEditTeam={handleEditTeam} onFullscreen={handleFullscreen} />
        </div>
        {editingTeam && (
          <div className="fixed inset-0 z-[60] bg-slate-950/80 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h2 className="text-lg font-bold mb-4">Renomear time</h2>
              <input
                autoFocus
                value={editingTeamName}
                onChange={(e) => setEditingTeamName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTeamName();
                  if (e.key === 'Escape') setEditingTeam(null);
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 mb-4"
                aria-label="Nome do time"
              />
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setEditingTeam(null)}
                  className="py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveTeamName}
                  className="py-2.5 rounded-xl font-bold bg-blue-600 text-white"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-dvh">
      <ScoreboardBody {...props} onEditTeam={handleEditTeam} />
      {editingTeam && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Renomear time</h2>
            <input
              autoFocus
              value={editingTeamName}
              onChange={(e) => setEditingTeamName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTeamName();
                if (e.key === 'Escape') setEditingTeam(null);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 mb-4"
              aria-label="Nome do time"
            />
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setEditingTeam(null)}
                className="py-2.5 rounded-xl font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={saveTeamName}
                className="py-2.5 rounded-xl font-bold bg-blue-600 text-white"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
