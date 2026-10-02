import { useState, useCallback } from 'react';
import { drawTeams } from '../utils/teamLogic';
import { uuid } from '../lib/id';
import { parsePresenceNames, stripCaptainMark, buildTeamsText } from '../lib/presence';

export function useDraw() {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [priorityPlayerIds, setPriorityPlayerIds] = useState([]);
  const [benchPlayerIds, setBenchPlayerIds] = useState([]);
  const [guests, setGuests] = useState([]);
  const [newGuestName, setNewGuestName] = useState('');
  const [config, setConfig] = useState({ playersPerTeam: 6, numTeams: 2 });
  const [drawResult, setDrawResult] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [lastPresence, setLastPresence] = useState(null);

  const playersPerTeam = Math.max(1, Number(config.playersPerTeam) || 6);
  const maxTeams = Math.max(2, Number(config.numTeams) || 2);
  const totalSelected = selectedPlayerIds.length + guests.length;
  const fullTeams = Math.floor(totalSelected / playersPerTeam);
  const canDraw = fullTeams >= 2;
  const shortForTwoTeams = Math.max(0, 2 * playersPerTeam - totalSelected);

  const handleDraw = useCallback((activeRacha) => {
    const activePlayers = activeRacha.players.filter(p => selectedPlayerIds.includes(p.id));
    const allPlayers = [...activePlayers, ...guests];
    const result = drawTeams({
      players: allPlayers,
      playersPerTeam,
      numTeams: maxTeams,
      priorityPlayerIds,
      benchPlayerIds
    });
    setDrawResult(result);
    setLastPresence({ selectedPlayerIds: [...selectedPlayerIds], priorityPlayerIds: [...priorityPlayerIds], benchPlayerIds: [...benchPlayerIds], guests: [...guests] });
  }, [selectedPlayerIds, guests, playersPerTeam, maxTeams, priorityPlayerIds, benchPlayerIds]);

  const copyTeams = useCallback(async (rachaName) => {
    if (!drawResult) return;
    const text = buildTeamsText(
      rachaName,
      drawResult.teams,
      drawResult.bench,
      priorityPlayerIds,
      benchPlayerIds
    );
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }, [drawResult, priorityPlayerIds, benchPlayerIds]);

  const toggleSelection = useCallback((id) => {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const togglePriority = useCallback((id) => {
    setPriorityPlayerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setBenchPlayerIds(prev => prev.filter(i => i !== id));
  }, []);

  const toggleBench = useCallback((id) => {
    setBenchPlayerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setPriorityPlayerIds(prev => prev.filter(i => i !== id));
  }, []);

  const selectAllMembers = useCallback((players) => {
    setSelectedPlayerIds(players.map(p => p.id));
  }, []);

  const clearMembers = useCallback((players) => {
    setSelectedPlayerIds([]);
    const memberIds = new Set(players.map(p => p.id));
    setPriorityPlayerIds(prev => prev.filter(id => !memberIds.has(id)));
    setBenchPlayerIds(prev => prev.filter(id => !memberIds.has(id)));
  }, []);

  const addGuest = useCallback((name, existingNames) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (existingNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    const guest = { id: uuid(), name: trimmed, isGuest: true };
    setGuests(prev => [...prev, guest]);
    setNewGuestName('');
    return true;
  }, []);

  const removeGuest = useCallback((guestId) => {
    setGuests(prev => prev.filter(g => g.id !== guestId));
    setPriorityPlayerIds(prev => prev.filter(id => id !== guestId));
    setBenchPlayerIds(prev => prev.filter(id => id !== guestId));
  }, []);

  const promoteGuest = useCallback((guest, addPlayerFn) => {
    const name = stripCaptainMark(guest.name);
    if (addPlayerFn(name)) {
      setGuests(prev => prev.filter(g => g.id !== guest.id));
      setPriorityPlayerIds(prev => prev.filter(id => id !== guest.id));
      setBenchPlayerIds(prev => prev.filter(id => id !== guest.id));
      return true;
    }
    return false;
  }, []);

  const importPlayers = useCallback((text, activeRacha, selectedIds) => {
    const names = parsePresenceNames(text).map(stripCaptainMark);
    if (names.length === 0) return { matched: 0, addedAsGuest: 0, duplicates: 0 };

    let matched = 0;
    let addedAsGuest = 0;
    let duplicates = 0;
    const nextSelected = new Set(selectedIds);
    const nextGuests = [...guests];
    const guestNames = new Set(nextGuests.map(g => g.name.toLowerCase()));

    for (const name of names) {
      const member = activeRacha.players.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (member) {
        const memberGuestIndex = nextGuests.findIndex(g => g.name.toLowerCase() === name.toLowerCase());
        if (memberGuestIndex >= 0) {
          nextGuests.splice(memberGuestIndex, 1);
          guestNames.delete(name.toLowerCase());
        }
        if (!nextSelected.has(member.id)) {
          nextSelected.add(member.id);
          matched++;
        }
      } else if (!guestNames.has(name.toLowerCase())) {
        nextGuests.push({ id: uuid(), name, isGuest: true });
        guestNames.add(name.toLowerCase());
        addedAsGuest++;
      } else {
        duplicates++;
      }
    }

    setSelectedPlayerIds([...nextSelected]);
    setGuests(nextGuests);
    setImportText('');
    setShowImport(false);
    return { matched, addedAsGuest, duplicates };
  }, [guests]);

  const resetDraw = useCallback(() => {
    setSelectedPlayerIds([]);
    setPriorityPlayerIds([]);
    setBenchPlayerIds([]);
    setGuests([]);
    setDrawResult(null);
  }, []);

  const restoreLastPresence = useCallback(() => {
    if (!lastPresence) return;
    setSelectedPlayerIds(lastPresence.selectedPlayerIds);
    setPriorityPlayerIds(lastPresence.priorityPlayerIds);
    setBenchPlayerIds(lastPresence.benchPlayerIds);
    setGuests(lastPresence.guests);
  }, [lastPresence]);

  return {
    selectedPlayerIds,
    setSelectedPlayerIds,
    priorityPlayerIds,
    setPriorityPlayerIds,
    benchPlayerIds,
    setBenchPlayerIds,
    guests,
    setGuests,
    newGuestName,
    setNewGuestName,
    config,
    setConfig,
    drawResult,
    setDrawResult,
    showImport,
    setShowImport,
    importText,
    setImportText,
    playersPerTeam,
    maxTeams,
    totalSelected,
    fullTeams,
    canDraw,
    shortForTwoTeams,
    handleDraw,
    copyTeams,
    toggleSelection,
    togglePriority,
    toggleBench,
    selectAllMembers,
    clearMembers,
    addGuest,
    removeGuest,
    promoteGuest,
    importPlayers,
    resetDraw,
    lastPresence,
    restoreLastPresence,
  };
}
