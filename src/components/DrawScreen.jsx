import { ArrowLeft, Settings, Plus, Star, UserPlus, UserCheck, RefreshCw, Copy, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { TEAM_COLORS } from '../lib/match';

export default function DrawScreen({
  racha,
  config,
  setConfig,
  selectedPlayerIds,
  priorityPlayerIds,
  guests,
  newGuestName,
  setNewGuestName,
  drawResult,
  showImport,
  setShowImport,
  importText,
  setImportText,
  onToggleSelection,
  onTogglePriority,
  onSelectAllMembers,
  onClearMembers,
  onAddGuest,
  onRemoveGuest,
  onPromoteGuest,
  onImportPlayers,
  onDraw,
  onCopyTeams,
  onStartMatch,
  onAdjust,
  onBack,
  onFinalize,
  canDraw,
  fullTeams,
  playersPerTeam,
  shortForTwoTeams,
  totalSelected,
}) {
  return (
    <div className="p-4 pb-32">
      <button
        onClick={onBack}
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
              onClick={onAdjust}
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
              onClick={onDraw}
              className="flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              <RefreshCw size={18} /> Redistribuir
            </button>
            <button
              onClick={onCopyTeams}
              className="flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
            >
              <Copy size={18} /> Copiar times
            </button>
          </div>

          <button
            onClick={onStartMatch}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
          >
            <Play size={18} /> Iniciar Placar
          </button>
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
                <button onClick={onSelectAllMembers} className="text-xs font-medium text-blue-600">Todos</button>
                <button onClick={onClearMembers} className="text-xs font-medium text-slate-400">Nenhum</button>
              </div>
            </div>
            {showImport ? (
              <div className="mb-3">
                <textarea
                  rows={4}
                  placeholder={'Cole a lista de quem vai jogar hoje. Ex.:\n1. Ana\n2. Bruno\n3. Carla'}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={onImportPlayers}
                    className="flex-1 bg-blue-600 text-white text-sm py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Adicionar à presença
                  </button>
                  <button
                    onClick={() => { setShowImport(false); setImportText(''); }}
                    className="bg-slate-200 text-slate-600 text-sm px-4 rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowImport(true)}
                className="mb-3 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Importar lista de presença
              </button>
            )}
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
              {racha.players.map(player => {
                const isSelected = selectedPlayerIds.includes(player.id);
                const isPriority = priorityPlayerIds.includes(player.id);
                return (
                  <div
                    key={player.id}
                    onClick={() => onToggleSelection(player.id)}
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
                      onClick={(e) => { e.stopPropagation(); onTogglePriority(player.id); }}
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
                onKeyDown={(e) => e.key === 'Enter' && onAddGuest()}
              />
              <button
                onClick={onAddGuest}
                className="bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-900"
                title="Adicionar convidado"
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
                    onClick={() => onPromoteGuest(guest)}
                    className="text-slate-500 hover:text-blue-600"
                    title="Adicionar à lista fixa do racha"
                  >
                    <UserCheck size={14} />
                  </button>
                  <button
                    onClick={() => onTogglePriority(guest.id)}
                    className={cn(
                      'ml-0.5',
                      priorityPlayerIds.includes(guest.id) ? 'text-yellow-600' : 'text-slate-400'
                    )}
                    title="Prioridade: vai para os Times 1 e 2"
                  >
                    <Star size={14} className={priorityPlayerIds.includes(guest.id) ? 'fill-yellow-600' : ''} />
                  </button>
                  <button
                    onClick={() => onRemoveGuest(guest.id)}
                    className="text-slate-500 hover:text-red-500"
                    title="Remover convidado"
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
                onClick={onDraw}
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
              onClick={onFinalize}
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
