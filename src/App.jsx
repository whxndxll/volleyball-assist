import React, { useState, useMemo, useRef } from 'react';
import { Plus, Users, Trash2, UserPlus, UserCheck, Trophy, Settings, ChevronRight, ArrowLeft, Star, Pencil, Copy, RefreshCw } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { cn } from './lib/utils';
import { drawTeams } from './utils/teamLogic';

const TEAM_COLORS = [
  { border: 'border-blue-500', title: 'text-blue-600', dot: 'bg-blue-500' },
  { border: 'border-orange-500', title: 'text-orange-600', dot: 'bg-orange-500' },
  { border: 'border-emerald-500', title: 'text-emerald-600', dot: 'bg-emerald-500' },
  { border: 'border-purple-500', title: 'text-purple-600', dot: 'bg-purple-500' },
  { border: 'border-rose-500', title: 'text-rose-600', dot: 'bg-rose-500' },
  { border: 'border-teal-500', title: 'text-teal-600', dot: 'bg-teal-500' },
];

function App() {
  const [rachas, setRachas, isLoading] = useLocalStorage('rachas', []);
  const [activeRachaId, setActiveRachaId] = useState(null);
  const [view, setView] = useState('list'); // list, detail, players, draw
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

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

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

  const showToast = (message, actionLabel, onAction) => {
    clearTimeout(toastTimer.current);
    setToast({ message, actionLabel, onAction });
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  const dismissToast = () => {
    clearTimeout(toastTimer.current);
    setToast(null);
  };

  const addRacha = () => {
    const name = newRachaName.trim();
    if (!name) return;
    if (rachas.some(r => r.name.toLowerCase() === name.toLowerCase())) {
      setRachaError('Já existe um racha com esse nome.');
      return;
    }
    const newRacha = {
      id: crypto.randomUUID(),
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
    if (activeRachaId === racha.id) setView('list');
    showToast('Racha excluído', 'Desfazer', () => {
      setRachas(prev => {
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
          players: [...r.players, { id: crypto.randomUUID(), name: trimmed }]
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
      priorityPlayerIds
    });
    setDrawResult(result);
  };

  const copyTeams = async () => {
    const lines = [`Sorteio - ${activeRacha.name}`];
    drawResult.teams.forEach((team, i) => {
      lines.push(`\nTime ${i + 1} (${team.length}):`);
      team.forEach(p => lines.push(`- ${p.name}${priorityPlayerIds.includes(p.id) ? ' *' : ''}`));
    });
    if (drawResult.bench.length > 0) {
      lines.push(`\nReserva (${drawResult.bench.length}):`);
      drawResult.bench.forEach(p => lines.push(`- ${p.name}`));
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
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
    if (!newGuestName.trim()) return;
    const guest = { id: crypto.randomUUID(), name: newGuestName.trim(), isGuest: true };
    setGuests([...guests, guest]);
    setNewGuestName('');
  };

  const removeGuest = (guestId) => {
    setGuests(guests.filter(g => g.id !== guestId));
    setPriorityPlayerIds(priorityPlayerIds.filter(id => id !== guestId));
  };

  const promoteGuest = (guest) => {
    const name = guest.name.replace(/\s*\(C\)$/, '').trim();
    if (addPlayer(name)) {
      setGuests(prev => prev.filter(g => g.id !== guest.id));
      setPriorityPlayerIds(prev => prev.filter(id => id !== guest.id));
      showToast(`${name} adicionado à lista do racha`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <p className="text-blue-600 font-medium">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-50 text-slate-900">
      {view === 'list' && (
        <>
          <header className="mb-8 p-4 pt-6">
            <h1 className="text-3xl font-bold text-blue-600">Vôlei Assist</h1>
            <p className="text-slate-500">Gerencie seus rachas com facilidade</p>
          </header>

          <div className="space-y-4 px-4 pb-8">
            <div className="space-y-1">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do novo racha..."
                  className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={newRachaName}
                  onChange={(e) => setNewRachaName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addRacha()}
                />
                <button
                  onClick={addRacha}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={24} />
                </button>
              </div>
              {rachaError && <p className="text-xs text-red-500">{rachaError}</p>}
            </div>

            <div className="grid gap-3">
              {rachas.map(racha => (
                <div
                  key={racha.id}
                  onClick={() => { setActiveRachaId(racha.id); setView('detail'); }}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-200 transition-all group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
                      <Users size={20} />
                    </div>
                    {editingRachaId === racha.id ? (
                      <input
                        autoFocus
                        value={editingRachaName}
                        onChange={(e) => setEditingRachaName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRachaName();
                          if (e.key === 'Escape') setEditingRachaId(null);
                        }}
                        onBlur={saveRachaName}
                        className="flex-1 px-2 py-1 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    ) : (
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{racha.name}</h3>
                        <p className="text-xs text-slate-400">{racha.players.length} jogadores</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditRacha(racha); }}
                      className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                      title="Renomear racha"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRacha(racha); }}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                    <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
                  </div>
                </div>
              ))}
              {rachas.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p>Nenhum racha cadastrado ainda.</p>
                  <p className="text-sm">Crie um no campo acima!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {view === 'detail' && (
        <>
          <div className="p-4">
            <button
              onClick={() => setView('list')}
              className="flex items-center gap-2 text-slate-500 mb-6 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={20} /> Meus Rachas
            </button>

            <header className="mb-8">
              <h1 className="text-2xl font-bold">{activeRacha.name}</h1>
              <p className="text-slate-500">O que você deseja fazer hoje?</p>
            </header>

            <div className="grid gap-4">
              <button
                onClick={() => setView('players')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 items-start hover:border-blue-200 transition-all"
              >
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                  <Users size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">Jogadores</h3>
                  <p className="text-sm text-slate-500">Gerencie a lista de membros fixos do racha ({activeRacha.players.length})</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setSelectedPlayerIds([]);
                  setPriorityPlayerIds([]);
                  setGuests([]);
                  setDrawResult(null);
                  setView('draw');
                }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 items-start hover:border-orange-200 transition-all"
              >
                <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                  <Trophy size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-lg">Novo Sorteio</h3>
                  <p className="text-sm text-slate-500">Inicie uma partida sorteando os times com quem está presente.</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {view === 'players' && (
        <>
          <div className="p-4">
            <button
              onClick={() => setView('detail')}
              className="flex items-center gap-2 text-slate-500 mb-6 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={20} /> Painel do Racha
            </button>

            <div className="flex justify-between items-end mb-6">
              <div>
                <h1 className="text-2xl font-bold">Jogadores</h1>
                <p className="text-slate-500">Lista de membros fixos</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
              <div className="p-4 border-b border-slate-50">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome do novo jogador..."
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:outline-none text-sm transition-all"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') addPlayer(newPlayerName); }}
                  />
                </div>
                {playerError && <p className="text-xs text-red-500 mt-2">{playerError}</p>}
              </div>
              <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
                {activeRacha.players.map(player => (
                  <div key={player.id} className="p-4 flex justify-between items-center group bg-white">
                    {editingPlayerId === player.id ? (
                      <input
                        autoFocus
                        value={editingPlayerName}
                        onChange={(e) => setEditingPlayerName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') savePlayerName();
                          if (e.key === 'Escape') setEditingPlayerId(null);
                        }}
                        onBlur={savePlayerName}
                        className="flex-1 mr-3 px-2 py-1 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    ) : (
                      <button
                        onClick={() => startEditPlayer(player)}
                        className="font-medium flex items-center gap-2 hover:text-blue-600 transition-colors"
                        title="Renomear jogador"
                      >
                        {player.name}
                        <Pencil size={14} className="text-slate-200 group-hover:text-blue-400 transition-colors" />
                      </button>
                    )}
                    <button
                      onClick={() => deletePlayer(player.id)}
                      className="text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {activeRacha.players.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    Nenhum jogador cadastrado. Adicione o primeiro acima!
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {view === 'draw' && (
        <div className="p-4 pb-32">
          <button
            onClick={() => setView('detail')}
            className="flex items-center gap-2 text-slate-500 mb-6 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={20} /> Voltar
          </button>

          <h1 className="text-2xl font-bold mb-2">Novo Sorteio</h1>
          <p className="text-slate-500 mb-6 text-sm">Selecione quem vai jogar hoje e configure os times.</p>

          {drawResult ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Resultado</h2>
                  <p className="text-sm text-slate-500">
                    {drawResult.teams.length} times
                    {drawResult.bench.length > 0 && ` · ${drawResult.bench.length} na reserva`}
                  </p>
                </div>
                <button
                  onClick={() => setDrawResult(null)}
                  className="text-blue-600 text-sm font-medium"
                >
                  Ajustar
                </button>
              </div>

              <div className="grid gap-4">
                {drawResult.teams.map((team, idx) => {
                  const color = TEAM_COLORS[idx % TEAM_COLORS.length];
                  return (
                    <div key={idx} className={cn('bg-white p-4 rounded-xl shadow-sm border-l-4', color.border)}>
                      <h3 className={cn('font-bold mb-2', color.title)}>
                        Time {idx + 1} · {team.length} {team.length === 1 ? 'jogador' : 'jogadores'}
                      </h3>
                      <ul className="space-y-1">
                        {team.map(p => (
                          <li key={p.id} className="flex items-center gap-2">
                            <span className={cn('w-2 h-2 rounded-full', color.dot)} />
                            {p.name}
                            {priorityPlayerIds.includes(p.id) && <Star size={14} className="fill-yellow-400 text-yellow-400" />}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                {drawResult.bench.length > 0 && (
                  <div className="bg-slate-100 p-4 rounded-xl border-l-4 border-slate-400">
                    <h3 className="font-bold text-slate-600 mb-2">
                      Reserva · {drawResult.bench.length} {drawResult.bench.length === 1 ? 'jogador' : 'jogadores'}
                    </h3>
                    <ul className="space-y-1 text-slate-500">
                      {drawResult.bench.map(p => (
                        <li key={p.id}>{p.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleDraw}
                  className="flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                >
                  <RefreshCw size={18} /> Redistribuir
                </button>
                <button
                  onClick={copyTeams}
                  className="flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
                >
                  <Copy size={18} /> Copiar times
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <section>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  1. Configurações <Settings size={18} />
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Jogadores / Time</label>
                    <input
                      type="number"
                      min="1"
                      value={config.playersPerTeam}
                      onChange={(e) => setConfig({ ...config, playersPerTeam: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Max. de Times</label>
                    <input
                      type="number"
                      min="2"
                      value={config.numTeams}
                      onChange={(e) => setConfig({ ...config, numTeams: Math.max(2, parseInt(e.target.value, 10) || 2) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200"
                    />
                  </div>
                  <p className="text-xs text-slate-400 col-span-2">
                    Os times são formados completos até esse limite; quem sobrar fica na reserva.
                  </p>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold">2. Presença</h3>
                  <div className="flex gap-3">
                    <button onClick={selectAllMembers} className="text-xs font-medium text-blue-600">Todos</button>
                    <button onClick={clearMembers} className="text-xs font-medium text-slate-400">Nenhum</button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  {totalSelected} selecionados ·{' '}
                  {canDraw
                    ? `${fullTeams} ${fullTeams === 1 ? 'time completo' : 'times completos'} · ${totalSelected - fullTeams * playersPerTeam} reserva`
                    : `faltam ${shortForTwoTeams} para 2 times completos`}
                </p>
                <p className="text-xs text-slate-400 mb-3">
                  Toque na estrela para priorizar — priorizados vão para os Times 1 e 2.
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                  {activeRacha.players.map(player => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    const isPriority = priorityPlayerIds.includes(player.id);
                    return (
                      <div
                        key={player.id}
                        onClick={() => toggleSelection(player.id)}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer',
                          isSelected
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-slate-100'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-5 h-5 rounded-md border flex items-center justify-center transition-colors',
                            isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                          )}>
                            {isSelected && <Plus size={14} className="text-white rotate-45" />}
                          </div>
                          <span className={cn(isSelected ? 'font-semibold' : '')}>
                            {player.name}
                          </span>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); togglePriority(player.id); }}
                          className={cn(
                            'p-1 rounded-full transition-colors',
                            isPriority ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-400'
                          )}
                          title="Prioridade: vai para os Times 1 e 2"
                        >
                          <Star size={20} className={isPriority ? 'fill-yellow-500' : ''} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="font-bold mb-3">3. Convidados</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Nome do convidado..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    value={newGuestName}
                    onChange={(e) => setNewGuestName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addGuest()}
                  />
                  <button
                    onClick={addGuest}
                    className="bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-900"
                  >
                    <UserPlus size={18} />
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-2">Convidados não são salvos na lista do racha.</p>
                <div className="flex flex-wrap gap-2">
                  {guests.map(guest => (
                    <div key={guest.id} className="flex items-center gap-1 bg-slate-200 px-3 py-1 rounded-full text-sm">
                      <span className="text-[10px] text-slate-500 uppercase">Convidado</span>
                      {guest.name}
                      <button
                        onClick={() => promoteGuest(guest)}
                        className="text-slate-500 hover:text-blue-600"
                        title="Adicionar à lista fixa do racha"
                      >
                        <UserCheck size={14} />
                      </button>
                      <button
                        onClick={() => togglePriority(guest.id)}
                        className={cn(
                          'ml-0.5',
                          priorityPlayerIds.includes(guest.id) ? 'text-yellow-600' : 'text-slate-400'
                        )}
                        title="Prioridade: vai para os Times 1 e 2"
                      >
                        <Star size={14} className={priorityPlayerIds.includes(guest.id) ? 'fill-yellow-600' : ''} />
                      </button>
                      <button
                        onClick={() => removeGuest(guest.id)}
                        className="text-slate-500 hover:text-red-500"
                      >
                        <Plus size={14} className="rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100">
            <div className="max-w-md mx-auto">
              {!drawResult ? (
                <div className="space-y-1">
                  <button
                    onClick={handleDraw}
                    disabled={!canDraw}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 disabled:bg-slate-300 disabled:shadow-none transition-all"
                  >
                    Sortear Times
                  </button>
                  {!canDraw && (
                    <p className="text-center text-xs text-slate-400">
                      Faltam {shortForTwoTeams} jogador{shortForTwoTeams === 1 ? '' : 'es'} para formar 2 times completos.
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setView('detail')}
                  className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold shadow-lg transition-all"
                >
                  Finalizar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md">
          <div className="bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-4">
            <span className="text-sm">{toast.message}</span>
            {toast.onAction && (
              <button
                onClick={() => { toast.onAction(); dismissToast(); }}
                className="text-blue-300 font-semibold text-sm shrink-0"
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
