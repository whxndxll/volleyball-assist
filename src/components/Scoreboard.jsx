import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronUp,
  CircleDot,
  Maximize,
  Minus,
  Pause,
  Plus,
  RotateCcw,
  Square,
  Timer,
  Trophy,
  Undo2,
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
  matchStatus,
  setScores,
  setsToWin,
  matchElapsedMs,
  formatElapsed,
  teamColor,
} from '../lib/match';

const DRAG_THRESHOLD = 24;

const buzz = (pattern) => {
  if (typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // alguns navegadores recusam fora de um gesto do usuário
  }
};

// Escada de severidade do alerta do set. Fica fora dos cards de propósito:
// dentro do card, o âmbar do "set point" era lido como a cor do Time 2.
const STATUS_TONE = {
  neutral: 'bg-white/10 text-white',
  set: 'bg-amber-300 text-slate-950',
  match: 'bg-rose-600 text-white',
};

function ScoreboardBody({
  match,
  winner,
  onAddPoint,
  onRemovePoint,
  onUndoLastPoint,
  onToggleServe,
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
  const leader = t0.points > t1.points ? t0 : t1;
  const status = matchStatus(match);
  const history = setScores(match);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (match.finished || match.paused) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [match.finished, match.paused]);

  const elapsedMs = matchElapsedMs(match, now);

  // Num racha o olhar vai para a bola, não para a tela: o pulso substitui a
  // conferida visual de que o ponto entrou.
  const totalSets = match.teams.reduce((sum, t) => sum + t.sets, 0);
  const seenSets = useRef(totalSets);
  useEffect(() => {
    if (totalSets > seenSets.current) buzz(match.finished ? [20, 50, 20, 50, 20] : [20, 50, 20]);
    seenSets.current = totalSets;
  }, [totalSets, match.finished]);

  const addPoint = (teamId) => {
    buzz(12);
    onAddPoint(teamId);
  };

  const timerTone = match.finished
    ? 'text-slate-500'
    : match.paused
      ? 'text-amber-700'
      : 'text-slate-100';

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
      addPoint(teamId);
    }
  };

  const endGesture = (e, teamId) => {
    const g = gesture.current;
    gesture.current = null;
    if (g && !g.moved && Math.abs(e.clientY - g.startY) < 8) {
      addPoint(teamId);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-slate-950 text-slate-100 p-3 sm:p-4 gap-2">
      <header className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="-ml-2 w-10 h-10 shrink-0 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="flex-1 flex flex-col items-center">
          <h1 className="text-base sm:text-lg font-bold leading-tight">Placar</h1>
          <div className={cn('flex items-center gap-1.5', timerTone)}>
            <Timer
              size={14}
              className={cn(
                !match.finished && !match.paused && 'motion-safe:animate-pulse'
              )}
            />
            <span className="font-bold tabular-nums text-sm">{formatElapsed(elapsedMs)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <div className="text-xs text-slate-400 text-right leading-tight">
            Melhor de {match.bestOf}
            <br />
            até {match.targetPoints} pts
          </div>
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Tela cheia e paisagem"
              title="Tela cheia e paisagem"
            >
              <Maximize size={18} />
            </button>
          )}
        </div>
      </header>

      {status && (
        <div
          role="status"
          className={cn(
            'mx-auto rounded-full px-4 py-1 text-xs font-black uppercase tracking-wide',
            STATUS_TONE[status.tone]
          )}
        >
          {status.label}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 flex-1 content-stretch min-h-0">
        {match.teams.map((team, idx) => {
          const color = teamColor(idx);
          const isLeading = !match.finished && t0.points !== t1.points && team.id === leader.id;
          const isServing = match.servingTeamId === team.id;
          const isWinner = Boolean(winner) && match.finished && team.id === winner.id;
          return (
            <div
              key={team.id}
              role="group"
              aria-label={team.name}
              onPointerDown={beginGesture}
              onPointerMove={(e) => moveGesture(e, team.id)}
              onPointerUp={(e) => endGesture(e, team.id)}
              onContextMenu={(e) => e.preventDefault()}
              className={cn(
                'rounded-3xl shadow-lg touch-none select-none flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-3',
                'bg-slate-900 border border-slate-800 border-t-4',
                color.rail,
                isLeading && `ring-2 ${color.ring}`,
                isWinner && `ring-2 ${color.ring}`,
                match.finished && !isWinner && 'opacity-60'
              )}
            >
              <div className="flex items-center gap-1.5" aria-label={`${team.sets} de ${targetSets} sets`}>
                {Array.from({ length: targetSets }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'w-2.5 h-2.5 rounded-full transition-colors',
                      i < team.sets ? color.pip : 'border border-white/60'
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 max-w-full">
                <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', color.pip)} aria-hidden="true" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTeam(team);
                  }}
                  className="font-bold text-sm sm:text-base text-white truncate max-w-full px-1 rounded hover:text-slate-300"
                  title="Toque para renomear"
                  aria-label={`Renomear ${team.name}`}
                >
                  {team.name}
                </button>
                {onToggleServe && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleServe(team.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onPointerUp={(e) => e.stopPropagation()}
                    aria-pressed={isServing}
                    aria-label={isServing ? `Time com o saque: ${team.name}` : `Dar o saque ao ${team.name}`}
                    title={isServing ? 'Sacar' : 'Dar o saque'}
                    className={cn(
                      'shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide transition-colors',
                      isServing
                        ? 'bg-white text-slate-950'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    )}
                  >
                    <CircleDot size={11} aria-hidden="true" />
                    Saque
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center gap-2 w-full">
                <button
                  onClick={(e) => { e.stopPropagation(); onRemovePoint(team.id); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onKeyDown={(e) => { if (e.key === 'ArrowDown') { e.preventDefault(); onRemovePoint(team.id); } }}
                  className="w-11 h-11 shrink-0 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
                  aria-label={`Remover ponto ${team.name}`}
                >
                  <Minus size={20} />
                </button>

                <div
                  aria-live="polite"
                  className={cn(
                    'flex-1 rounded-2xl bg-black/40 px-2 py-1 flex items-center justify-center gap-1',
                    isLeading && `border-b-2 ${color.rail}`
                  )}
                >
                  {isLeading && <ChevronUp size={20} className={cn('shrink-0', color.accentText)} aria-hidden="true" />}
                  <p className="font-black text-white tabular-nums leading-none tracking-tight drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)] text-7xl">
                    {team.points}
                  </p>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); addPoint(team.id); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); addPoint(team.id); } }}
                  className="w-14 h-14 shrink-0 rounded-full bg-white text-slate-950 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
                  aria-label={`Adicionar ponto ${team.name}`}
                >
                  <Plus size={26} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {history.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap" aria-label="Placar por sets">
          {history.map((set, i) => {
            const winnerIdx = match.teams.findIndex(t => t.id === set.teamId);
            const setColor = teamColor(winnerIdx < 0 ? 0 : winnerIdx);
            const winnerName = winnerIdx >= 0 ? match.teams[winnerIdx].name : '';
            return (
              <div
                key={`${set.teamId}-${i}`}
                className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-2 py-0.5"
                aria-label={`Set ${i + 1}: ${winnerName} ${set.points} a ${set.loserPoints}`}
              >
                <span className="sr-only">Set {i + 1}:</span>
                <span className={cn('font-black tabular-nums text-xs sm:text-sm', setColor.accentText)}>
                  {set.points}
                </span>
                <span className="text-slate-600 text-xs" aria-hidden="true">–</span>
                <span className="font-semibold tabular-nums text-xs sm:text-sm text-slate-400">
                  {set.loserPoints}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {match.finished ? (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Resultado da partida"
            className="bg-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
          >
            <div className="mx-auto mb-4 bg-amber-300 text-slate-950 p-4 rounded-full w-fit">
              <Trophy size={40} />
            </div>
            <h2 className="text-2xl font-black mb-1">
              {winner ? `${winner.name} venceu!` : 'Partida encerrada'}
            </h2>
            <p className="text-slate-400 mb-1">
              {match.teams.map(t => `${t.name} ${t.sets}`).join(' · ')}
            </p>
            {history.length > 0 && (
              <p className="text-slate-500 text-sm mb-6 tabular-nums">
                {history
                  .map(set => {
                    const w = match.teams.find(t => t.id === set.teamId);
                    return `${set.points}–${set.loserPoints} ${w ? w.name : ''}`;
                  })
                  .join('  ·  ')}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={onResetMatch}
                className="flex items-center justify-center gap-2 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors"
              >
                <RotateCcw size={18} /> Zerar placar
              </button>
              <button
                onClick={onBack}
                className="flex items-center justify-center gap-2 bg-white/10 text-slate-100 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors"
              >
                <ArrowLeft size={18} /> Voltar
              </button>
            </div>
            <button
              onClick={onStopMatch}
              className="flex items-center justify-center gap-2 w-full bg-rose-950 text-rose-200 border border-rose-900 py-3 rounded-xl font-bold hover:bg-rose-900/60 transition-colors"
            >
              <Square size={16} fill="currentColor" /> Parar placar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onResetMatch}
            className="w-12 h-12 flex items-center justify-center bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 active:scale-95 transition-all"
            aria-label="Zerar"
            title="Zerar"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={onUndoLastPoint}
            className="w-12 h-12 flex items-center justify-center bg-slate-800 text-amber-300 rounded-xl font-bold hover:bg-slate-700 active:scale-95 transition-all"
            aria-label="Desfazer último ponto"
            title="Desfazer"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={onPauseMatch}
            className="w-12 h-12 flex items-center justify-center bg-white text-slate-950 rounded-xl font-bold active:scale-95 transition-all"
            aria-label="Pausar"
            title="Pausar"
          >
            <Pause size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function RenameTeamDialog({ value, onChange, onCancel, onSave }) {
  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h2 className="text-lg font-bold mb-4">Renomear time</h2>
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onCancel();
          }}
          className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-100 mb-4"
          aria-label="Nome do time"
        />
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="py-2.5 rounded-xl font-bold bg-white/10 text-slate-300 hover:bg-white/20 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="py-2.5 rounded-xl font-bold bg-white text-slate-950"
          >
            Salvar
          </button>
        </div>
      </div>
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

  const dialog = editingTeam ? (
    <RenameTeamDialog
      value={editingTeamName}
      onChange={setEditingTeamName}
      onCancel={() => setEditingTeam(null)}
      onSave={saveTeamName}
    />
  ) : null;

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
        {dialog}
      </div>
    );
  }

  return (
    <div className="h-dvh bg-slate-950">
      <ScoreboardBody {...props} onEditTeam={handleEditTeam} onFullscreen={handleFullscreen} />
      {dialog}
    </div>
  );
}