import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { drawTeams } from './utils/teamLogic';
import { setsToWin } from './lib/match';
import { computePlayerStats } from './lib/stats';
import { uuid } from './lib/id';
import { parsePresenceNames, stripCaptainMark, buildTeamsText } from './lib/presence';
import { serializeBackup, parseBackup } from './lib/backup';
import { useToast } from './hooks/useToast';
import Toast from './components/Toast';
import RachaList from './components/RachaList';
import RachaDetail from './components/RachaDetail';
import PlayerList from './components/PlayerList';
import DrawScreen from './components/DrawScreen';
import MatchHistory from './components/MatchHistory';
import Scoreboard from './components/Scoreboard';
import StatsScreen from './components/StatsScreen';

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
  const [view, setView] = useState(() => readSession('va-view') || 'list'); // list, detail, players, draw, matches, match, stats
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
  const [guests, setGuests] = useState([]);
  const [newGuestName, setNewGuestName] = useState('');
  const [config, setConfig] = useState({ playersPerTeam: 6, numTeams: 2 });
  const [drawResult, setDrawResult] = useState(null);

  // State for presence import
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  // State for scoreboard
  const [matches, setMatches, isMatchesLoading] = useLocalStorage('matches', []);
  const [currentMatchId, setCurrentMatchId] = useState(() => readSession('va-current-match'));
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
  useEffect(() => { saveSession('va-current-match', currentMatchId); }, [currentMatchId]);

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

  const activeMatch = useMemo(() =>
    matches.find(m => m.rachaId === activeRachaId && !m.finished),
    [matches, activeRachaId]
  );

  const matchesForRacha = useMemo(() =>
    matches.filter(m => m.rachaId === activeRachaId).sort((a, b) => b.createdAt - a.createdAt),
    [matches, activeRachaId]
  );

  const playerStats = useMemo(() => computePlayerStats(matchesForRacha), [matchesForRacha]);

  const currentMatch = useMemo(() =>
    matches.find(m => m.id === currentMatchId) || activeMatch,
    [matches, currentMatchId, activeMatch]
  );

  const currentMatchWinner = currentMatch
    ? currentMatch.teams.find(t => t.sets >= setsToWin(currentMatch)) || null
    : null;

  // Se a navegação restaurada aponta para dados que não existem (ex.: racha deletado), volta para a lista
  useEffect(() => {
    if (isLoading || isMatchesLoading) return;
    if (view !== 'list' && !activeRacha) {
      setView('list');
    } else if (view === 'match' && !currentMatch) {
      setView('matches');
    }
  }, [isLoading, isMatchesLoading, view, activeRacha, currentMatch]);

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
    const rachaMatches = matches
      .map((m, i) => (m.rachaId === racha.id ? { match: m, index: i } : null))
      .filter(Boolean);
    setRachas(prev => prev.filter(r => r.id !== racha.id));
    setMatches(prev => prev.filter(m => m.rachaId !== racha.id));
    if (activeRachaId === racha.id) {
      setActiveRachaId(null);
      setView('list');
    }
    if (currentMatchId && rachaMatches.some(({ match }) => match.id === currentMatchId)) {
      setCurrentMatchId(null);
    }
    showToast('Racha excluído', 'Desfazer', () => {
      setRachas(prev => {
        if (prev.some(r => r.id === racha.id)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, racha);
        return next;
      });
      setMatches(prev => {
        if (rachaMatches.length === 0) return prev;
        const next = [...prev];
        rachaMatches.forEach(({ match, index: matchIndex }) => {
          if (next.some(m => m.id === match.id)) return;
          next.splice(Math.min(matchIndex, next.length), 0, match);
        });
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
    // Propaga o novo nome nas partidas do racha para manter as estatísticas consistentes
    setMatches(prev => prev.map(m => {
      if (m.rachaId !== activeRachaId) return m;
      return {
        ...m,
        teams: m.teams.map(t => ({
          ...t,
          players: t.players.map(p => p.id === editingPlayerId ? { ...p, name } : p),
        })),
      };
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
      priorityPlayerIds
    });
    setDrawResult(result);
  };

  const copyTeams = async () => {
    const text = buildTeamsText(activeRacha.name, drawResult.teams, drawResult.bench, priorityPlayerIds);
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
  };

  const selectAllMembers = () => {
    setSelectedPlayerIds(activeRacha.players.map(p => p.id));
  };

  const clearMembers = () => {
    setSelectedPlayerIds([]);
    setPriorityPlayerIds(prev => prev.filter(id => !activeRacha.players.some(p => p.id === id)));
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
  };

  const promoteGuest = (guest) => {
    const name = stripCaptainMark(guest.name);
    if (addPlayer(name)) {
      setGuests(prev => prev.filter(g => g.id !== guest.id));
      setPriorityPlayerIds(prev => prev.filter(id => id !== guest.id));
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
    if (activeMatch && !window.confirm('Já existe um placar em andamento. Encerrar e iniciar um novo?')) {
      return;
    }
    const match = {
      id: uuid(),
      rachaId: activeRachaId,
      createdAt: Date.now(),
      targetPoints: matchConfig.targetPoints,
      bestOf: matchConfig.bestOf,
      finished: false,
      teams: drawResult.teams.map((players, i) => ({
        id: uuid(),
        name: `Time ${i + 1}`,
        players,
        points: 0,
        sets: 0,
      })),
    };
    setMatches(prev => [
      match,
      ...prev.map(m => m.rachaId === activeRachaId ? { ...m, finished: true } : m),
    ]);
    setCurrentMatchId(match.id);
    setDrawResult(null);
    setView('match');
  };

  const updateMatch = (matchId, updater) => {
    setMatches(prev => prev.map(m => m.id === matchId ? updater(m) : m));
  };

  const addPoint = (matchId, teamId, delta) => {
    updateMatch(matchId, m => {
      if (m.finished) return m;
      return {
        ...m,
        teams: m.teams.map(t => t.id === teamId ? { ...t, points: Math.max(0, t.points + delta) } : t),
      };
    });
  };

  const addSet = (matchId, teamId, delta) => {
    updateMatch(matchId, m => {
      const teams = m.teams.map(t => t.id === teamId ? { ...t, sets: Math.max(0, t.sets + delta) } : t);
      const winner = teams.find(t => t.sets >= setsToWin(m));
      return { ...m, teams, finished: m.finished || Boolean(winner) };
    });
  };

  const finishMatch = (matchId) => {
    updateMatch(matchId, m => ({ ...m, finished: true }));
  };

  const resetMatch = (matchId) => {
    updateMatch(matchId, m => ({
      ...m,
      finished: false,
      teams: m.teams.map(t => ({ ...t, points: 0, sets: 0 })),
    }));
  };

  const deleteMatch = (matchId) => {
    const index = matches.findIndex(m => m.id === matchId);
    const match = matches[index];
    if (!match) return;
    setMatches(prev => prev.filter(m => m.id !== matchId));
    setCurrentMatchId(null);
    setView('matches');
    showToast('Partida excluída', 'Desfazer', () => {
      setMatches(prev => {
        if (prev.some(m => m.id === matchId)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, match);
        return next;
      });
    });
  };

  const handleExport = () => {
    try {
      const blob = new Blob([serializeBackup({ rachas, matches })], { type: 'application/json' });
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
        const { rachas: importedRachas, matches: importedMatches } = parseBackup(reader.result);
        setRachas(importedRachas);
        setMatches(importedMatches);
        setActiveRachaId(null);
        setCurrentMatchId(null);
        setView('list');
        showToast('Dados importados com sucesso!');
      } catch {
        showToast('Arquivo de backup inválido.');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  if (isLoading || isMatchesLoading) {
    return (
      <div className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <p className="text-blue-600 font-medium">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
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
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(d => !d)}
          onExport={handleExport}
          onImportFile={handleImportFile}
        />
      )}

      {view === 'detail' && activeRacha && (
        <RachaDetail
          racha={activeRacha}
          activeMatch={activeMatch}
          matchesCount={matchesForRacha.length}
          onBack={() => setView('list')}
          onPlayers={() => setView('players')}
          onMatches={() => { setCurrentMatchId(null); setView('matches'); }}
          onStats={() => setView('stats')}
          onNewDraw={() => {
            setSelectedPlayerIds([]);
            setPriorityPlayerIds([]);
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

      {view === 'matches' && activeRacha && (
        <MatchHistory
          rachaName={activeRacha.name}
          matches={matchesForRacha}
          onOpenMatch={(match) => { setCurrentMatchId(match.id); setView('match'); }}
          onDeleteMatch={deleteMatch}
          onBack={() => setView('detail')}
        />
      )}

      {view === 'match' && currentMatch && activeRacha && (
        <Scoreboard
          rachaName={activeRacha.name}
          match={currentMatch}
          winner={currentMatchWinner}
          onAddPoint={(teamId, delta) => addPoint(currentMatch.id, teamId, delta)}
          onAddSet={(teamId, delta) => addSet(currentMatch.id, teamId, delta)}
          onFinishMatch={() => finishMatch(currentMatch.id)}
          onResetMatch={() => resetMatch(currentMatch.id)}
          onBack={() => { setCurrentMatchId(null); setView('matches'); }}
        />
      )}

      {view === 'stats' && activeRacha && (
        <StatsScreen
          rachaName={activeRacha.name}
          stats={playerStats}
          onBack={() => setView('detail')}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
