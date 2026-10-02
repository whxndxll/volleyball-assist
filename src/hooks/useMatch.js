import { useState, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { setsToWin } from '../lib/match';
import { uuid } from '../lib/id';

export function createMatchFromDraw(drawResult, matchConfig) {
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
    teams: drawResult.teams.map((players, i) => ({
      id: uuid(),
      name: `Time ${i + 1}`,
      players,
      points: 0,
      sets: 0,
    })),
  };
}

export function useMatch() {
  const [match, setMatch, isMatchLoading] = useLocalStorage('activeMatch', null);
  const [matchHistory, setMatchHistory] = useLocalStorage('matchHistory', []);
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
        const nextTeams = teams.map(t => ({ ...t, points: 0, sets: t.id === leader.id ? t.sets + 1 : t.sets }));
        const finished = nextTeams.some(t => t.sets >= setsToWin(prev));
        return { ...prev, teams: nextTeams, finished };
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
      return {
        ...prev,
        finished: false,
        teams: prev.teams.map(t =>
          t.id === last.teamId ? { ...t, points: Math.max(0, t.points - 1) } : t
        ),
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
      teams: prev.teams.map(t => ({ ...t, points: 0, sets: 0 })),
    } : prev));
  }, [setMatch]);

  const stopMatch = useCallback(() => {
    setMatch(prev => {
      if (prev && (prev.teams.some(t => t.sets > 0 || t.points > 0) || prev.finished)) {
        const snapshot = {
          ...prev,
          endedAt: Date.now(),
          winner: prev.teams.find(t => t.sets >= setsToWin(prev))?.name || null,
        };
        setMatchHistory(hist => [snapshot, ...hist].slice(0, 50));
      }
      return null;
    });
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
    startMatch,
    addPoint,
    removePoint,
    undoLastPoint,
    pauseMatch,
    resumeMatch,
    resetMatch,
    stopMatch,
    clearMatchHistory,
    renameTeam,
  };
}
