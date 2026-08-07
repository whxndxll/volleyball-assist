import { Plus, Users, Trash2, ChevronRight, Pencil } from 'lucide-react';

export default function RachaList({
  rachas,
  newRachaName,
  setNewRachaName,
  rachaError,
  editingRachaId,
  editingRachaName,
  setEditingRachaName,
  onCancelEditRacha,
  onAddRacha,
  onDeleteRacha,
  onStartEditRacha,
  onSaveRachaName,
  onOpenRacha,
}) {
  return (
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
              onKeyDown={(e) => e.key === 'Enter' && onAddRacha()}
            />
            <button
              onClick={onAddRacha}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              title="Criar racha"
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
              onClick={() => onOpenRacha(racha)}
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
                      if (e.key === 'Enter') onSaveRachaName();
                      if (e.key === 'Escape') onCancelEditRacha();
                    }}
                    onBlur={onSaveRachaName}
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
                  onClick={(e) => { e.stopPropagation(); onStartEditRacha(racha); }}
                  className="p-2 text-slate-300 hover:text-blue-500 transition-colors"
                  title="Renomear racha"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteRacha(racha); }}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  title="Excluir racha"
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
  );
}
