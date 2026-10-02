import React, { useState, useEffect } from 'react';
import { useRachas } from './hooks/useRachas';
import { useMatch, createMatchFromDraw } from './hooks/useMatch';
import { useDraw } from './hooks/useDraw';
import { drawTeams } from './utils/teamLogic';
import { serializeBackup, parseBackup } from './lib/backup';
import { stripCaptainMark } from './lib/presence';
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
  const [view, setView] = useState(() => readSession('va-view') || 'list');
  const [darkMode, setDarkMode] = useState(() => {
    if (document.documentElement.classList.contains('dark')) return true;
    try {
      const stored = localStorage.getItem('va-theme');
      if (stored) return stored === 'dark';
    } catch {
      // localStorage pode ser bloqueado
    }
    return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const {
    rachas,
    setRachas,
    isLoading,
    activeRacha,
    activeRachaId,
    setActiveRachaId,
    newRachaName,
    setNewRachaName,
    newPlayerName,
    setNewPlayerName,
    rachaError,
    playerError,
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
  } = useRachas();

  const {
    match,
    setMatch,
    isMatchLoading,
    matchConfig,
    setMatchConfig,
    matchWinner,
    startMatch,
    addPoint,
    removePoint,
    undoLastPoint,
    pauseMatch,
    resumeMatch,
    resetMatch,
    stopMatch,
    matchHistory,
    clearMatchHistory,
    renameTeam,
  } = useMatch();

  const {
    selectedPlayerIds,
    priorityPlayerIds,
    benchPlayerIds,
    guests,
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
  } = useDraw();

  const { toast, showToast, dismissToast } = useToast();

  const handlePauseMatch = () => {
    pauseMatch();
    setView('list');
  };

  const handleResumeMatch = () => {
    resumeMatch();
    setView('match');
  };

  const handleStopMatch = () => {
    stopMatch();
    setView(activeRacha ? 'detail' : 'list');
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('va-theme', darkMode ? 'dark' : 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', darkMode ? '#0f172a' : '#2563eb');
  }, [darkMode]);

  useEffect(() => { saveSession('va-view', view); }, [view]);
  useEffect(() => { saveSession('va-active-racha', activeRachaId); }, [activeRachaId]);

  useEffect(() => {
    if (isLoading || isMatchLoading) return;
    if (view !== 'list' && view !== 'match' && !activeRacha) {
      setView('list');
    } else if (view === 'match' && !match) {
      setView('detail');
    }
  }, [isLoading, isMatchLoading, view, activeRacha, match]);

  const handleDeleteRacha = (racha) => {
    const { index } = deleteRacha(racha);
    showToast('Racha excluído', 'Desfazer', () => restoreRacha(racha, index));
  };

  const handleDeletePlayer = (playerId) => {
    const { player, index } = deletePlayer(playerId);
    showToast(`${player.name} removido`, 'Desfazer', () => restorePlayer(player, index));
  };

  const handleCopyTeams = async () => {
    const success = await copyTeams(activeRacha.name);
    showToast(success ? 'Times copiados!' : 'Não foi possível copiar os times.');
  };

  const handleAddGuest = () => {
    const existingNames = [...guests, ...activeRacha.players].map(p => p.name);
    const success = addGuest(newGuestName, existingNames);
    if (!success && newGuestName.trim()) {
      showToast('Esse nome já está presente.');
    }
  };

  const handlePromoteGuest = (guest) => {
    const success = promoteGuest(guest, addPlayer);
    if (success) {
      showToast(`${stripCaptainMark(guest.name)} adicionado à lista do racha`);
    }
  };

  const handleImportPlayers = () => {
    const result = importPlayers(importText, activeRacha, selectedPlayerIds);
    if (result.matched === 0 && result.addedAsGuest === 0) {
      showToast(result.duplicates > 0 ? `${result.duplicates} nome(s) duplicado(s) ignorado(s).` : 'Nenhum nome reconhecido na lista.');
    } else {
      const dupMsg = result.duplicates > 0 ? ` ${result.duplicates} duplicado(s) ignorado(s).` : '';
      showToast(`${result.matched} da lista e ${result.addedAsGuest} convidado(s) adicionado(s).${dupMsg}`);
    }
  };

  const handleStartMatch = () => {
    if (match) {
      showToast('Já existe um placar em andamento. Pare-o antes de iniciar outro.');
      return;
    }
    const success = startMatch(drawResult);
    if (success) {
      setDrawResult(null);
      setView('match');
    }
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
    const newMatch = createMatchFromDraw(result, { targetPoints: 25, bestOf: 3 });
    setMatch(newMatch);
    setActiveRachaId(racha.id);
    setView('match');
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
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
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
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
      } finally {
        setIsImporting(false);
        event.target.value = '';
      }
    };
    reader.onerror = () => {
      setIsImporting(false);
      showToast('Erro ao ler o arquivo.');
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
          onUndoLastPoint={undoLastPoint}
          onPauseMatch={handlePauseMatch}
          onResetMatch={resetMatch}
          onStopMatch={handleStopMatch}
          onBack={() => setView(activeRacha ? 'detail' : 'list')}
          onRenameTeam={renameTeam}
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
          onDeleteRacha={handleDeleteRacha}
          onStartEditRacha={startEditRacha}
          onSaveRachaName={saveRachaName}
          onOpenRacha={(racha) => { setActiveRachaId(racha.id); setView('detail'); }}
          match={match}
          onContinuePlacar={handleResumeMatch}
          onResetPlacar={resetMatch}
          onStopPlacar={handleStopMatch}
          onQuickStartPlacar={quickStartPlacar}
          darkMode={darkMode}
          onToggleTheme={() => setDarkMode(d => !d)}
          onExport={handleExport}
          onImportFile={handleImportFile}
          isExporting={isExporting}
          isImporting={isImporting}
          matchHistory={matchHistory}
          onClearHistory={clearMatchHistory}
        />
      )}

      {view === 'detail' && activeRacha && (
        <RachaDetail
          racha={activeRacha}
          activeMatch={match}
          onBack={() => setView('list')}
          onPlayers={() => setView('players')}
          onPlacar={() => (match && match.paused ? handleResumeMatch() : setView('match'))}
          onNewDraw={() => {
            resetDraw();
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
          onDeletePlayer={handleDeletePlayer}
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
          onSelectAllMembers={() => selectAllMembers(activeRacha.players)}
          onClearMembers={() => clearMembers(activeRacha.players)}
          onAddGuest={handleAddGuest}
          onRemoveGuest={removeGuest}
          onPromoteGuest={handlePromoteGuest}
          onImportPlayers={handleImportPlayers}
          onDraw={() => handleDraw(activeRacha)}
          onCopyTeams={handleCopyTeams}
          onStartMatch={handleStartMatch}
          onAdjust={() => setDrawResult(null)}
          onBack={() => setView('detail')}
          onFinalize={() => setView('detail')}
          onRestorePresence={restoreLastPresence}
          hasLastPresence={!!lastPresence}
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
