import { useState, useMemo, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { uuid } from '../lib/id';

export function useRachas(onError) {
  const [rachas, setRachas, isLoading] = useLocalStorage('rachas', [], onError);
  const [activeRachaId, setActiveRachaId] = useState(null);
  const [newRachaName, setNewRachaName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [rachaError, setRachaError] = useState('');
  const [playerError, setPlayerError] = useState('');
  const [editingRachaId, setEditingRachaId] = useState(null);
  const [editingRachaName, setEditingRachaName] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');

  const activeRacha = useMemo(
    () => rachas.find(r => r.id === activeRachaId) || null,
    [rachas, activeRachaId]
  );

  const addRacha = useCallback(() => {
    const name = newRachaName.trim();
    if (!name) return;
    if (rachas.some(r => r.name.toLowerCase() === name.toLowerCase())) {
      setRachaError('Já existe um racha com esse nome.');
      return;
    }
    const newRacha = { id: uuid(), name, players: [] };
    setRachas(prev => [...prev, newRacha]);
    setNewRachaName('');
    setRachaError('');
  }, [newRachaName, rachas, setRachas]);

  const deleteRacha = useCallback((racha) => {
    const index = rachas.findIndex(r => r.id === racha.id);
    setRachas(prev => prev.filter(r => r.id !== racha.id));
    if (activeRachaId === racha.id) {
      setActiveRachaId(null);
    }
    return { racha, index };
  }, [rachas, activeRachaId, setRachas]);

  const restoreRacha = useCallback((racha, index) => {
    setRachas(prev => {
      if (prev.some(r => r.id === racha.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, racha);
      return next;
    });
  }, [setRachas]);

  const startEditRacha = useCallback((racha) => {
    setEditingRachaId(racha.id);
    setEditingRachaName(racha.name);
  }, []);

  const saveRachaName = useCallback(() => {
    const name = editingRachaName.trim();
    if (!editingRachaId) return;
    setEditingRachaId(null);
    if (!name) return;
    if (rachas.some(r => r.id !== editingRachaId && r.name.toLowerCase() === name.toLowerCase())) {
      setRachaError('Já existe um racha com esse nome.');
      return;
    }
    setRachas(prev => prev.map(r => r.id === editingRachaId ? { ...r, name } : r));
    setRachaError('');
  }, [editingRachaName, editingRachaId, rachas, setRachas]);

  const addPlayer = useCallback((name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (activeRacha.players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setPlayerError('Esse jogador já está na lista.');
      return false;
    }
    setRachas(prev => prev.map(r => {
      if (r.id === activeRachaId) {
        return { ...r, players: [...r.players, { id: uuid(), name: trimmed }] };
      }
      return r;
    }));
    setNewPlayerName('');
    setPlayerError('');
    return true;
  }, [activeRacha, activeRachaId, setRachas]);

  const deletePlayer = useCallback((playerId) => {
    const index = activeRacha.players.findIndex(p => p.id === playerId);
    const player = activeRacha.players.find(p => p.id === playerId);
    if (editingPlayerId === playerId) setEditingPlayerId(null);
    setRachas(prev => prev.map(r => {
      if (r.id === activeRachaId) {
        return { ...r, players: r.players.filter(p => p.id !== playerId) };
      }
      return r;
    }));
    return { player, index };
  }, [activeRacha, activeRachaId, editingPlayerId, setRachas]);

  const restorePlayer = useCallback((player, index) => {
    setRachas(prev => prev.map(r => {
      if (r.id !== activeRachaId) return r;
      if (r.players.some(p => p.id === player.id)) return r;
      const players = [...r.players];
      players.splice(Math.min(index, players.length), 0, player);
      return { ...r, players };
    }));
  }, [activeRachaId, setRachas]);

  const startEditPlayer = useCallback((player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerName(player.name);
  }, []);

  const savePlayerName = useCallback(() => {
    const name = editingPlayerName.trim();
    if (!editingPlayerId) return;
    setEditingPlayerId(null);
    if (!name) return;
    if (activeRacha.players.some(p => p.id !== editingPlayerId && p.name.toLowerCase() === name.toLowerCase())) {
      setPlayerError('Esse jogador já está na lista.');
      return;
    }
    setRachas(prev => prev.map(r => {
      if (r.id === activeRachaId) {
        return { ...r, players: r.players.map(p => p.id === editingPlayerId ? { ...p, name } : p) };
      }
      return r;
    }));
    setPlayerError('');
  }, [editingPlayerName, editingPlayerId, activeRacha, activeRachaId, setRachas]);

  const setRachasDirectly = useCallback((next) => {
    setRachas(next);
  }, [setRachas]);

  return {
    rachas,
    setRachas: setRachasDirectly,
    isLoading,
    activeRacha,
    activeRachaId,
    setActiveRachaId,
    newRachaName,
    setNewRachaName,
    newPlayerName,
    setNewPlayerName,
    rachaError,
    setRachaError,
    playerError,
    setPlayerError,
    editingRachaId,
    setEditingRachaId,
    editingRachaName,
    setEditingRachaName,
    editingPlayerId,
    setEditingPlayerId,
    editingPlayerName,
    setEditingPlayerName,
    addRacha,
    deleteRacha,
    restoreRacha,
    startEditRacha,
    saveRachaName,
    addPlayer,
    deletePlayer,
    restorePlayer,
    startEditPlayer,
    savePlayerName,
  };
}
