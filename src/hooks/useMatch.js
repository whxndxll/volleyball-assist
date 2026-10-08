import { useState, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { setsToWin } from '../lib/match';
import { uuid } from '../lib/id';

export function createMatchFromDraw(drawResult, matchConfig) {
  const teams = drawResult.teams.map((players, i) => ({
    id: uuid(),
    name: `Time ${i + 1}`,
    players,
    points: 0,
    sets: 0,
  }));
  return {
    id: uuid(),
    targetPoints: Math.max(1, Number(matchConfig.targetPoints) || 25),
    bestOf: matchConfig.bestOf,
    createdAt: Date.now(),
    startedAt: Date.now(),
    resumedAt: Date.now(),
    accumulatedMs: 0,
    paused: false,
    finished: false,
    teams,
    setScores: [],
  };
}

export function useMatch(onError) {
  const [match, setMatch, isMatchLoading] = useLocalStorage('activeMatch', null, onError);
  const [matchHistory, setMatchHistory] = useLocalStorage('matchHistory', [], onError);
  const [matchConfig, setMatchConfig] = useState({ targetPoints: 25, bestOf: 3 });
  const lastActionRef = useRef(null);

  const matchWinner = useMemo(
    () => match ? match.teams.find(t => t.sets >= setsToWin(match)) || null : null,
    [match]
  );

  const startMatch = useCallback((drawResult) => {
    if (!drawResult || drawResult.teams.length === 0) return false;
    if (match) return false;
    const newMatch = createMatchFromDraw(drawResult, matchConfig);
    setMatch(newMatch);
    return true;
  }, [match, matchConfig, setMatch]);

  const addPoint = useCallback((teamId) => {
    lastActionRef.current = { type: 'add', teamId };
    setMatch(prev => {
      if (!prev || prev.finished || prev.paused) return prev;
      const teams = prev.teams.map(t =>
        t.id === teamId ? { ...t, points: t.points + 1 } : t
      );
      const leader = teams.find(t =>
        t.points >= prev.targetPoints && Math.abs(teams[0].points - teams[1].points) >= 2
      );
      if (leader) {
        const loser = teams.find(t => t.id !== leader.id);
        lastActionRef.current = { type: 'add', teamId, closedSet: true };
        // O placar do set é registrado antes de zerar os pontos, senão 25–18 se
        // perde assim que o set fecha.
        const nextSetScores = [
          ...(prev.setScores || []),
          { teamId: leader.id, points: leader.points, loserPoints: loser ? loser.points : 0 },
        ];
        const nextTeams = teams.map(t => ({ ...t, points: 0, sets: t.id === leader.id ? t.sets + 1 : t.sets }));
        const finished = nextTeams.some(t => t.sets >= setsToWin(prev));
        return {
          ...prev,
          teams: nextTeams,
          setScores: nextSetScores,
          finished,
        };
      }
      return { ...prev, teams };
    });
  }, [setMatch]);

  const undoLastPoint = useCallback(() => {
    const last = lastActionRef.current;
    if (!last || last.type !== 'add') return;
    lastActionRef.current = null;
    setMatch(prev => {
      if (!prev || prev.paused) return prev;
      const history = prev.setScores || [];
      const closed = last.closedSet ? history[history.length - 1] : null;
      if (!closed) {
        return {
          ...prev,
          finished: false,
          teams: prev.teams.map(t =>
            t.id === last.teamId ? { ...t, points: Math.max(0, t.points - 1) } : t
          ),
        };
      }
      // Desfazer o ponto que fechou o set precisa devolver o set inteiro.
      return {
        ...prev,
        finished: false,
        setScores: history.slice(0, -1),
        teams: prev.teams.map(t => {
          if (t.id === closed.teamId) {
            return { ...t, sets: Math.max(0, t.sets - 1), points: Math.max(0, closed.points - 1) };
          }
          return { ...t, points: closed.loserPoints };
        }),
      };
    });
  }, [setMatch]);

  const removePoint = useCallback((teamId) => {
    setMatch(prev => {
      if (!prev || prev.finished || prev.paused) return prev;
      return {
        ...prev,
        teams: prev.teams.map(t =>
          t.id === teamId ? { ...t, points: Math.max(0, t.points - 1) } : t
        ),
      };
    });
  }, [setMatch]);

  const pauseMatch = useCallback(() => {
    setMatch(prev => (prev && !prev.finished ? { ...prev, paused: true } : prev));
  }, [setMatch]);

  const resumeMatch = useCallback(() => {
    setMatch(prev => (prev ? { ...prev, paused: false, resumedAt: Date.now() } : prev));
  }, [setMatch]);

  const resetMatch = useCallback(() => {
    setMatch(prev => (prev ? {
      ...prev,
      finished: false,
      paused: false,
      startedAt: Date.now(),
      resumedAt: Date.now(),
      accumulatedMs: 0,
      setScores: [],
      teams: prev.teams.map(t => ({ ...t, points: 0, sets: 0 })),
    } : prev));
  }, [setMatch]);

  // Devolve o snapshot arquivado para que a chamada possa oferecer "Desfazer":
// parar o placar descarta a partida em andamento e, sem isso, era irreversível.
const stopMatch = useCallback(() => {
  if (!match) return null;
  const hadProgress = match.teams.some(t => t.sets > 0 || t.points > 0) || match.finished;
  const snapshot = hadProgress
    ? {
      ...match,
      endedAt: Date.now(),
      winner: match.teams.find(t => t.sets >= setsToWin(match))?.name || null,
    }
    : null;
  setMatch(null);
  if (snapshot) setMatchHistory(hist => [snapshot, ...hist].slice(0, 50));
  return snapshot;
}, [match, setMatch, setMatchHistory]);

const restoreMatch = useCallback((snapshot) => {
  if (!snapshot) return;
  setMatch(snapshot);
  setMatchHistory(hist => hist.filter(m => m.id !== snapshot.id));
}, [setMatch, setMatchHistory]);

  const clearMatchHistory = useCallback(() => {
    setMatchHistory([]);
  }, [setMatchHistory]);

  const renameTeam = useCallback((teamId, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setMatch(prev => prev ? {
      ...prev,
      teams: prev.teams.map(t => t.id === teamId ? { ...t, name: trimmed } : t),
    } : prev);
  }, [setMatch]);

  return {
    match,
    setMatch,
    isMatchLoading,
    matchConfig,
    setMatchConfig,
    matchWinner,
matchHistory,
    setMatchHistory,
    startMatch,
    addPoint,
    removePoint,
    undoLastPoint,
    pauseMatch,
    resumeMatch,
    resetMatch,
    stopMatch,
    restoreMatch,
    clearMatchHistory,
    renameTeam,
  };
}
