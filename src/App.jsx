import React, { useState, useMemo } from 'react';
import { Plus, Users, Trash2, UserPlus, Trophy, Settings, ChevronRight, ArrowLeft, Star } from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { cn } from './lib/utils';
import { drawTeams } from './utils/teamLogic';

function App() {
  const [rachas, setRachas, isLoading] = useLocalStorage('rachas', []);
  const [activeRachaId, setActiveRachaId] = useState(null);
  const [view, setView] = useState('list'); // list, detail, players, draw
  const [newRachaName, setNewRachaName] = useState('');
  
  // State for drawing
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [priorityPlayerIds, setPriorityPlayerIds] = useState([]);
  const [guests, setGuests] = useState([]);
  const [newGuestName, setNewGuestName] = useState('');
  const [config, setConfig] = useState({ playersPerTeam: 6, numTeams: 2 });
  const [drawResult, setDrawResult] = useState(null);

  const activeRacha = useMemo(() => 
    rachas.find(r => r.id === activeRachaId), 
    [rachas, activeRachaId]
  );

  const addRacha = () => {
    if (!newRachaName.trim()) return;
    const newRacha = {
      id: crypto.randomUUID(),
      name: newRachaName,
      players: []
    };
    setRachas([...rachas, newRacha]);
    setNewRachaName('');
  };

  const deleteRacha = (id) => {
    if (window.confirm('Deseja realmente excluir este racha?')) {
      setRachas(rachas.filter(r => r.id !== id));
      if (activeRachaId === id) setView('list');
    }
  };

  const addPlayer = (name) => {
    if (!name.trim()) return;
    const updatedRachas = rachas.map(r => {
      if (r.id === activeRachaId) {
        return {
          ...r,
          players: [...r.players, { id: crypto.randomUUID(), name }]
        };
      }
      return r;
    });
    setRachas(updatedRachas);
  };

  const deletePlayer = (playerId) => {
    const updatedRachas = rachas.map(r => {
      if (r.id === activeRachaId) {
        return {
          ...r,
          players: r.players.filter(p => p.id !== playerId)
        };
      }
      return r;
    });
    setRachas(updatedRachas);
  };

  const handleDraw = () => {
    const activePlayers = activeRacha.players.filter(p => selectedPlayerIds.includes(p.id));
    const allPlayers = [...activePlayers, ...guests];
    const result = drawTeams({
      players: allPlayers,
      playersPerTeam: config.playersPerTeam,
      numTeams: config.numTeams,
      priorityPlayerIds
    });
    setDrawResult(result);
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

  const addGuest = () => {
    if (!newGuestName.trim()) return;
    const guest = { id: crypto.randomUUID(), name: `${newGuestName} (C)`, isGuest: true };
    setGuests([...guests, guest]);
    setNewGuestName('');
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-4 min-h-screen flex items-center justify-center bg-slate-50 text-slate-900">
        <p className="text-blue-600 font-medium">Carregando...</p>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div className="max-w-md mx-auto p-4 min-h-screen bg-slate-50 text-slate-900">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-600">Vôlei Assist</h1>
          <p className="text-slate-500">Gerencie seus rachas com facilidade</p>
        </header>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Nome do novo racha..." 
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={newRachaName}
              onChange={(e) => setNewRachaName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addRacha()}
            />
            <button 
              onClick={addRacha}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>

          <div className="grid gap-3">
            {rachas.map(racha => (
              <div 
                key={racha.id}
                onClick={() => { setActiveRachaId(racha.id); setView('detail'); }}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{racha.name}</h3>
                    <p className="text-xs text-slate-400">{racha.players.length} jogadores</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteRacha(racha.id); }}
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
      </div>
    );
  }

  if (view === 'detail') {
    return (
      <div className="max-w-md mx-auto p-4 min-h-screen bg-slate-50 text-slate-900">
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
    );
  }

  if (view === 'players') {
    return (
      <div className="max-w-md mx-auto p-4 min-h-screen bg-slate-50 text-slate-900">
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
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addPlayer(e.target.value);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
            {activeRacha.players.map(player => (
              <div key={player.id} className="p-4 flex justify-between items-center group bg-white">
                <span className="font-medium">{player.name}</span>
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
    );
  }

  if (view === 'draw') {
    return (
      <div className="max-w-md mx-auto p-4 min-h-screen bg-slate-50 text-slate-900 pb-32">
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
               <h2 className="text-xl font-bold">Resultado</h2>
               <button 
                 onClick={() => setDrawResult(null)}
                 className="text-blue-600 text-sm font-medium"
               >
                 Refazer/Ajustar
               </button>
             </div>
             
             <div className="grid gap-4">
                {drawResult.teams.map((team, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
                    <h3 className="font-bold text-blue-600 mb-2">Time {idx + 1}</h3>
                    <ul className="space-y-1">
                      {team.map(p => (
                        <li key={p.id} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-200" />
                          {p.name}
                          {priorityPlayerIds.includes(p.id) && <Star size={14} className="fill-yellow-400 text-yellow-400" />}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {drawResult.bench.length > 0 && (
                  <div className="bg-slate-100 p-4 rounded-xl border-l-4 border-slate-400">
                    <h3 className="font-bold text-slate-600 mb-2">Reserva</h3>
                    <ul className="space-y-1 text-slate-500">
                      {drawResult.bench.map(p => (
                        <li key={p.id}>{p.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
                    value={config.playersPerTeam}
                    onChange={(e) => setConfig({...config, playersPerTeam: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400 uppercase">Total de Times</label>
                  <input 
                    type="number" 
                    value={config.numTeams}
                    onChange={(e) => setConfig({...config, numTeams: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-bold mb-3 flex items-center justify-between">
                <span>2. Presença</span>
                <span className="text-xs font-normal text-slate-400">{selectedPlayerIds.length + guests.length} selecionados</span>
              </h3>
              
              <div className="space-y-2 max-h-60 overflow-y-auto p-1">
                {activeRacha.players.map(player => (
                  <div 
                    key={player.id}
                    onClick={() => toggleSelection(player.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer",
                      selectedPlayerIds.includes(player.id) 
                        ? "bg-blue-50 border-blue-200" 
                        : "bg-white border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                        selectedPlayerIds.includes(player.id) ? "bg-blue-600 border-blue-600" : "border-slate-300"
                      )}>
                        {selectedPlayerIds.includes(player.id) && <Plus size={14} className="text-white rotate-45" />}
                      </div>
                      <span className={cn(selectedPlayerIds.includes(player.id) ? "font-semibold" : "")}>
                        {player.name}
                      </span>
                    </div>
                    
                    {selectedPlayerIds.includes(player.id) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); togglePriority(player.id); }}
                        className={cn(
                          "p-1 rounded-full transition-colors",
                          priorityPlayerIds.includes(player.id) ? "text-yellow-500" : "text-slate-300"
                        )}
                      >
                        <Star size={20} className={priorityPlayerIds.includes(player.id) ? "fill-yellow-500" : ""} />
                      </button>
                    )}
                  </div>
                ))}
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
                  onKeyPress={(e) => e.key === 'Enter' && addGuest()}
                />
                <button 
                  onClick={addGuest}
                  className="bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-900"
                >
                  <UserPlus size={18} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {guests.map(guest => (
                  <div key={guest.id} className="flex items-center gap-2 bg-slate-200 px-3 py-1 rounded-full text-sm">
                    {guest.name}
                    <button 
                      onClick={() => {
                        setGuests(guests.filter(g => g.id !== guest.id));
                        setPriorityPlayerIds(priorityPlayerIds.filter(id => id !== guest.id));
                      }}
                      className="text-slate-500 hover:text-red-500"
                    >
                      <Plus size={14} className="rotate-45" />
                    </button>
                    <button 
                      onClick={() => togglePriority(guest.id)}
                      className={cn(
                        "ml-1",
                        priorityPlayerIds.includes(guest.id) ? "text-yellow-600" : "text-slate-400"
                      )}
                    >
                      <Star size={14} className={priorityPlayerIds.includes(guest.id) ? "fill-yellow-600" : ""} />
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
              <button 
                onClick={handleDraw}
                disabled={selectedPlayerIds.length + guests.length < config.playersPerTeam}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 disabled:bg-slate-300 disabled:shadow-none transition-all"
              >
                Sortear Times
              </button>
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
    );
  }

  return null;
}

export default App;
