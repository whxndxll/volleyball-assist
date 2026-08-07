import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

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
  return (
    <div className="p-4">
      <button
        onClick={onBack}
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
              onKeyDown={(e) => { if (e.key === 'Enter') onAddPlayer(newPlayerName); }}
            />
          </div>
          {playerError && <p className="text-xs text-red-500 mt-2">{playerError}</p>}
        </div>
        <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
          {players.map(player => (
            <div key={player.id} className="p-4 flex justify-between items-center group bg-white">
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
                  className="flex-1 mr-3 px-2 py-1 rounded-md border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              ) : (
                <button
                  onClick={() => onStartEditPlayer(player)}
                  className="font-medium flex items-center gap-2 hover:text-blue-600 transition-colors"
                  title="Renomear jogador"
                >
                  {player.name}
                  <Pencil size={14} className="text-slate-200 group-hover:text-blue-400 transition-colors" />
                </button>
              )}
              <button
                onClick={() => onDeletePlayer(player.id)}
                className="text-slate-300 hover:text-red-500 transition-all"
                title="Remover jogador"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {players.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm">
              Nenhum jogador cadastrado. Adicione o primeiro acima!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
