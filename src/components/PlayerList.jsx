import { ArrowLeft, Pencil, Trash2, Search } from 'lucide-react';
import { useState } from 'react';

export default function PlayerList({
  players,
  newPlayerName,
  setNewPlayerName,
  playerError,
  editingPlayerId,
  editingPlayerName,
  setEditingPlayerName,
  onCancelEdit,
  onAddPlayer,
  onDeletePlayer,
  onStartEditPlayer,
  onSavePlayerName,
  onBack,
}) {
  const [filter, setFilter] = useState('');
  const filteredPlayers = filter.trim()
    ? players.filter(p => p.name.toLowerCase().includes(filter.trim().toLowerCase()))
    : players;

  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 mb-6 hover:text-blue-600 transition-colors dark:text-slate-400"
      >
        <ArrowLeft size={20} /> Painel do Racha
      </button>

      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold">Jogadores</h1>
          <p className="text-slate-500 dark:text-slate-400">Lista de membros fixos</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8 dark:bg-slate-800 dark:border-slate-700">
        <div className="p-4 border-b border-slate-50 dark:border-slate-700">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome do novo jogador..."
              aria-label="Nome do novo jogador"
              className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:outline-none text-sm transition-all dark:bg-slate-700 dark:text-slate-100 dark:focus:bg-slate-600"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onAddPlayer(newPlayerName); }}
            />
          </div>
          {playerError && <p className="text-xs text-red-500 mt-2">{playerError}</p>}
          <div className="relative mt-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar jogadores..."
              aria-label="Filtrar jogadores"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:outline-none text-sm transition-all dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:bg-slate-600"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto dark:divide-slate-700">
          {filteredPlayers.map(player => (
            <div key={player.id} className="p-4 flex justify-between items-center group bg-white dark:bg-slate-800">
              {editingPlayerId === player.id ? (
                <input
                  autoFocus
                  value={editingPlayerName}
                  onChange={(e) => setEditingPlayerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSavePlayerName();
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                  onBlur={onSavePlayerName}
                  className="flex-1 mr-3 px-2 py-1 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-slate-700 dark:border-blue-500 dark:text-slate-100"
                />
              ) : (
                <button
                  onClick={() => onStartEditPlayer(player)}
                  className="font-medium flex items-center gap-2 hover:text-blue-600 transition-colors"
                  title="Renomear jogador"
                  aria-label={`Renomear jogador ${player.name}`}
                >
                  {player.name}
                  <Pencil size={14} className="text-slate-200 group-hover:text-blue-400 transition-colors dark:text-slate-600" />
                </button>
              )}
              <button
                onClick={() => onDeletePlayer(player.id)}
                className="text-slate-300 hover:text-red-500 transition-all dark:text-slate-500"
                title="Remover jogador"
                aria-label={`Remover jogador ${player.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {filteredPlayers.length === 0 && players.length > 0 && (
            <div className="p-8 text-center text-slate-400 text-sm dark:text-slate-500">
              Nenhum jogador encontrado.
            </div>
          )}
          {players.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm dark:text-slate-500">
              Nenhum jogador cadastrado. Adicione o primeiro acima!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
