import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { drawTeams } from './utils/teamLogic';
import { setsToWin } from './lib/match';
import { uuid } from './lib/id';
import { parsePresenceNames, stripCaptainMark, buildTeamsText } from './lib/presence';
import { serializeBackup, parseBackup } from './lib/backup';
import { useToast } from './hooks/useToast';
import Toast from './components/Toast';
import RachaList from './components/RachaList';
import RachaDetail from './components/RachaDetail';
import PlayerList from './components/PlayerList';
import DrawScreen from './components/DrawScreen';
import Scoreboard from './components/Scoreboard';

const readSession = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const saveSession = (key, value) => {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // sessionStorage pode ser bloqueado (ex.: navegação privada)
  }
};

function App() {
  const [rachas, setRachas, isLoading] = useLocalStorage('rachas', []);
  const [activeRachaId, setActiveRachaId] = useState(() => readSession('va-active-racha'));
  const [view, setView] = useState(() => readSession('va-view') || 'list'); // list, detail, players, draw, match
  const [newRachaName, setNewRachaName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [rachaError, setRachaError] = useState('');
  const [playerError, setPlayerError] = useState('');
  const [editingRachaId, setEditingRachaId] = useState(null);
  const [editingRachaName, setEditingRachaName] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editingPlayerName, setEditingPlayerName] = useState('');

  // State for drawing
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [priorityPlayerIds, setPriorityPlayerIds] = useState([]);
  const [benchPlayerIds, setBenchPlayerIds] = useState([]);
  const [guests, setGuests] = useState([]);
  const [newGuestName, setNewGuestName] = useState('');
  const [config, setConfig] = useState({ playersPerTeam: 6, numTeams: 2 });
  const [drawResult, setDrawResult] = useState(null);

  // State for presence import
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  // Placar: partida única e efêmera (sobrevive ao refresh, mas não vira histórico)
  const [match, setMatch, isMatchLoading] = useLocalStorage('activeMatch', null);
  const [matchConfig, setMatchConfig] = useState({ targetPoints: 25, bestOf: 3 });

  // State for theme
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('va-theme', darkMode ? 'dark' : 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', darkMode ? '#0f172a' : '#2563eb');
  }, [darkMode]);

  // Persist navigation across refresh
  useEffect(() => { saveSession('va-view', view); }, [view]);
  useEffect(() => { saveSession('va-active-racha', activeRachaId); }, [activeRachaId]);

  const { toast, showToast, dismissToast } = useToast();

  const activeRacha = useMemo(() =>
    rachas.find(r => r.id === activeRachaId),
    [rachas, activeRachaId]
  );

  const playersPerTeam = Math.max(1, Number(config.playersPerTeam) || 6);
  const maxTeams = Math.max(2, Number(config.numTeams) || 2);
  const totalSelected = selectedPlayerIds.length + guests.length;
  const fullTeams = Math.floor(totalSelected / playersPerTeam);
  const canDraw = fullTeams >= 2;
  const shortForTwoTeams = Math.max(0, 2 * playersPerTeam - totalSelected);

  const matchWinner = match
    ? match.teams.find(t => t.sets >= setsToWin(match)) || null
    : null;

  // Se a navegação restaurada aponta para dados que não existem (ex.: racha deletado), volta para a lista
  useEffect(() => {
    if (isLoading || isMatchLoading) return;
    if (view !== 'list' && view !== 'match' && !activeRacha) {
      setView('list');
    } else if (view === 'match' && !match) {
      setView('detail');
    }
  }, [isLoading, isMatchLoading, view, activeRacha, match]);

  const addRacha = () => {
    const name = newRachaName.trim();
    if (!name) return;
    if (rachas.some(r => r.name.toLowerCase() === name.toLowerCase())) {
      setRachaError('Já existe um racha com esse nome.');
      return;
    }
    const newRacha = {
      id: uuid(),
      name,
      players: []
    };
    setRachas([...rachas, newRacha]);
    setNewRachaName('');
    setRachaError('');
  };

  const deleteRacha = (racha) => {
    const index = rachas.findIndex(r => r.id === racha.id);
    setRachas(prev => prev.filter(r => r.id !== racha.id));
    if (activeRachaId === racha.id) {
      setActiveRachaId(null);
      setView('list');
    }
    showToast('Racha excluído', 'Desfazer', () => {
      setRachas(prev => {
        if (prev.some(r => r.id === racha.id)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, racha);
        return next;
      });
    });
  };

  const startEditRacha = (racha) => {
    setEditingRachaId(racha.id);
    setEditingRachaName(racha.name);
  };

  const saveRachaName = () => {
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
  };

  const addPlayer = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (activeRacha.players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setPlayerError('Esse jogador já está na lista.');
      return false;
    }
    setRachas(prev => prev.map(r => {
      if (r.id === activeRachaId) {
        return {
          ...r,
          players: [...r.players, { id: uuid(), name: trimmed }]
        };
      }
      return r;
    }));
    setNewPlayerName('');
    setPlayerError('');
    return true;
  };

  const deletePlayer = (playerId) => {
    const index = activeRacha.players.findIndex(p => p.id === playerId);
    const player = activeRacha.players.find(p => p.id === playerId);
    if (editingPlayerId === playerId) setEditingPlayerId(null);
    setRachas(prev => prev.map(r => {
      if (r.id === activeRachaId) {
        return { ...r, players: r.players.filter(p => p.id !== playerId) };
      }
      return r;
    }));
    showToast(`${player.name} removido`, 'Desfazer', () => {
      setRachas(prev => prev.map(r => {
        if (r.id !== activeRachaId) return r;
        if (r.players.some(p => p.id === player.id)) return r;
        const players = [...r.players];
        players.splice(Math.min(index, players.length), 0, player);
        return { ...r, players };
      }));
    });
  };

  const startEditPlayer = (player) => {
    setEditingPlayerId(player.id);
    setEditingPlayerName(player.name);
  };

  const savePlayerName = () => {
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
        return {
          ...r,
          players: r.players.map(p => p.id === editingPlayerId ? { ...p, name } : p)
        };
      }
      return r;
    }));
    setPlayerError('');
  };

  const handleDraw = () => {
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
  };

  const copyTeams = async () => {
    const text = buildTeamsText(
      activeRacha.name,
      drawResult.teams,
      drawResult.bench,
      priorityPlayerIds,
      benchPlayerIds
    );
    try {
      await navigator.clipboard.writeText(text);
      showToast('Times copiados!');
    } catch {
      showToast('Não foi possível copiar os times.');
    }
  };

  const toggleSelection = (id) => {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const togglePriority = (id) => {
    setPriorityPlayerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setBenchPlayerIds(prev => prev.filter(i => i !== id));
  };

  const toggleBench = (id) => {
    setBenchPlayerIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setPriorityPlayerIds(prev => prev.filter(i => i !== id));
  };

  const selectAllMembers = () => {
    setSelectedPlayerIds(activeRacha.players.map(p => p.id));
  };

  const clearMembers = () => {
    setSelectedPlayerIds([]);
    setPriorityPlayerIds(prev => prev.filter(id => !activeRacha.players.some(p => p.id === id)));
    setBenchPlayerIds(prev => prev.filter(id => !activeRacha.players.some(p => p.id === id)));
  };

  const addGuest = () => {
    const name = newGuestName.trim();
    if (!name) return;
    const exists = [...guests, ...activeRacha.players].some(p => p.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      showToast('Esse nome já está presente.');
      return;
    }
    const guest = { id: uuid(), name, isGuest: true };
    setGuests([...guests, guest]);
    setNewGuestName('');
  };

  const removeGuest = (guestId) => {
    setGuests(guests.filter(g => g.id !== guestId));
    setPriorityPlayerIds(priorityPlayerIds.filter(id => id !== guestId));
    setBenchPlayerIds(benchPlayerIds.filter(id => id !== guestId));
  };

  const promoteGuest = (guest) => {
    const name = stripCaptainMark(guest.name);
    if (addPlayer(name)) {
      setGuests(prev => prev.filter(g => g.id !== guest.id));
      setPriorityPlayerIds(prev => prev.filter(id => id !== guest.id));
      setBenchPlayerIds(prev => prev.filter(id => id !== guest.id));
      showToast(`${name} adicionado à lista do racha`);
    }
  };

  const importPlayers = () => {
    const names = parsePresenceNames(importText).map(stripCaptainMark);

    if (names.length === 0) {
      showToast('Nenhum nome reconhecido na lista.');
      return;
    }

    let matched = 0;
    let addedAsGuest = 0;
    const nextSelected = new Set(selectedPlayerIds);
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
      }
    }

    setSelectedPlayerIds([...nextSelected]);
    setGuests(nextGuests);
    setImportText('');
    setShowImport(false);
    showToast(`${matched} da lista e ${addedAsGuest} convidado(s) adicionado(s).`);
  };

  const startMatch = () => {
    if (!drawResult || drawResult.teams.length === 0) return;
    if (match) {
      showToast('Já existe um placar em andamento. Pare-o antes de iniciar outro.');
      return;
    }
    const newMatch = {
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
    setMatch(newMatch);
    setDrawResult(null);
    setView('match');
  };

  const addPoint = (teamId) => {
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
  };

  const removePoint = (teamId) => {
    setMatch(prev => {
      if (!prev || prev.finished || prev.paused) return prev;
      return {
        ...prev,
        teams: prev.teams.map(t =>
          t.id === teamId ? { ...t, points: Math.max(0, t.points - 1) } : t
        ),
      };
    });
  };

  const pauseMatch = () => {
    setMatch(prev => (prev && !prev.finished ? { ...prev, paused: true } : prev));
    setView('list');
  };

  const resumeMatch = () => {
    setMatch(prev => (prev ? { ...prev, paused: false, resumedAt: Date.now() } : prev));
    setView('match');
  };

  const resetMatch = () => {
    setMatch(prev => (prev ? {
      ...prev,
      finished: false,
      paused: false,
      startedAt: Date.now(),
      resumedAt: Date.now(),
      accumulatedMs: 0,
      teams: prev.teams.map(t => ({ ...t, points: 0, sets: 0 })),
    } : prev));
  };

  const stopMatch = () => {
    setMatch(null);
    setView(activeRacha ? 'detail' : 'list');
  };

  const quickStartPlacar = () => {
    if (match) {
      showToast('Já existe um placar em andamento. Pare-o antes de iniciar outro.');
      return;
    }
    const racha = rachas.find(r => r.players.length >= 12);
    if (!racha) {
      showToast('Nenhum racha com 12 ou mais jogadores para o sorteio rápido.');
      return;
    }
    const result = drawTeams({
      players: racha.players,
      playersPerTeam: 6,
      numTeams: 2,
      priorityPlayerIds: [],
      benchPlayerIds: [],
    });
    if (result.teams.length < 2) {
      showToast('Nenhum racha com jogadores suficientes para o sorteio rápido.');
      return;
    }
    const newMatch = {
      id: uuid(),
      targetPoints: 25,
      bestOf: 3,
      createdAt: Date.now(),
      startedAt: Date.now(),
      resumedAt: Date.now(),
      accumulatedMs: 0,
      paused: false,
      finished: false,
      teams: result.teams.map((players, i) => ({
        id: uuid(),
        name: `Time ${i + 1}`,
        players,
        points: 0,
        sets: 0,
      })),
    };
    setMatch(newMatch);
    setActiveRachaId(racha.id);
    setView('match');
  };

  const handleExport = () => {
    try {
      const blob = new Blob([serializeBackup({ rachas })], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'volei-assist-backup.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup exportado!');
    } catch {
      showToast('Não foi possível exportar o backup.');
    }
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { rachas: importedRachas } = parseBackup(reader.result);
        setRachas(importedRachas);
        setMatch(null);
        setActiveRachaId(null);
        setView('list');
        showToast('Dados importados com sucesso!');
      } catch {
        showToast('Arquivo de backup inválido.');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  if (isLoading || isMatchLoading) {
    return (
      <div className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <p className="text-blue-600 font-medium">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {view === 'match' && match ? (
        <Scoreboard
          match={match}
          winner={matchWinner}
          onAddPoint={addPoint}
          onRemovePoint={removePoint}
          onPauseMatch={pauseMatch}
          onResetMatch={resetMatch}
          onStopMatch={stopMatch}
          onBack={() => setView(activeRacha ? 'detail' : 'list')}
        />
      ) : (
      <div className="max-w-md mx-auto min-h-screen">
      {view === 'list' && (
        <RachaList
          rachas={rachas}
          newRachaName={newRachaName}
          setNewRachaName={setNewRachaName}
          rachaError={rachaError}
          editingRachaId={editingRachaId}
          editingRachaName={editingRachaName}
          setEditingRachaName={setEditingRachaName}
          onCancelEditRacha={() => setEditingRachaId(null)}
          onAddRacha={addRacha}
          onDeleteRacha={deleteRacha}
          onStartEditRacha={startEditRacha}
          onSaveRachaName={saveRachaName}
          onOpenRacha={(racha) => { setActiveRachaId(racha.id); setView('detail'); }}
          match={match}
          onContinuePlacar={resumeMatch}
          onResetPlacar={resetMatch}
          onStopPlacar={stopMatch}
          onQuickStartPlacar={quickStartPlacar}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(d => !d)}
          onExport={handleExport}
          onImportFile={handleImportFile}
        />
      )}

      {view === 'detail' && activeRacha && (
        <RachaDetail
          racha={activeRacha}
          activeMatch={match}
          onBack={() => setView('list')}
          onPlayers={() => setView('players')}
          onPlacar={() => (match && match.paused ? resumeMatch() : setView('match'))}
          onNewDraw={() => {
            setSelectedPlayerIds([]);
            setPriorityPlayerIds([]);
            setBenchPlayerIds([]);
            setGuests([]);
            setDrawResult(null);
            setView('draw');
          }}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(d => !d)}
        />
      )}

      {view === 'players' && activeRacha && (
        <PlayerList
          players={activeRacha.players}
          newPlayerName={newPlayerName}
          setNewPlayerName={setNewPlayerName}
          playerError={playerError}
          editingPlayerId={editingPlayerId}
          editingPlayerName={editingPlayerName}
          setEditingPlayerName={setEditingPlayerName}
          onCancelEdit={() => setEditingPlayerId(null)}
          onAddPlayer={addPlayer}
          onDeletePlayer={deletePlayer}
          onStartEditPlayer={startEditPlayer}
          onSavePlayerName={savePlayerName}
          onBack={() => setView('detail')}
        />
      )}

      {view === 'draw' && activeRacha && (
        <DrawScreen
          racha={activeRacha}
          config={config}
          setConfig={setConfig}
          selectedPlayerIds={selectedPlayerIds}
          priorityPlayerIds={priorityPlayerIds}
          benchPlayerIds={benchPlayerIds}
          guests={guests}
          newGuestName={newGuestName}
          setNewGuestName={setNewGuestName}
          drawResult={drawResult}
          showImport={showImport}
          setShowImport={setShowImport}
          importText={importText}
          setImportText={setImportText}
          onToggleSelection={toggleSelection}
          onTogglePriority={togglePriority}
          onToggleBench={toggleBench}
          onSelectAllMembers={selectAllMembers}
          onClearMembers={clearMembers}
          onAddGuest={addGuest}
          onRemoveGuest={removeGuest}
          onPromoteGuest={promoteGuest}
          onImportPlayers={importPlayers}
          onDraw={handleDraw}
          onCopyTeams={copyTeams}
          onStartMatch={startMatch}
          onAdjust={() => setDrawResult(null)}
          onBack={() => setView('detail')}
          onFinalize={() => setView('detail')}
          canDraw={canDraw}
          fullTeams={fullTeams}
          playersPerTeam={playersPerTeam}
          shortForTwoTeams={shortForTwoTeams}
          totalSelected={totalSelected}
          matchConfig={matchConfig}
          setMatchConfig={setMatchConfig}
        />
      )}
      </div>
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
