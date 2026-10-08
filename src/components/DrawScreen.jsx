import { ArrowLeft, Settings, Plus, Star, UserPlus, UserCheck, RefreshCw, Copy, Play, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { teamColor } from '../lib/match';

export default function DrawScreen({
  racha,
  config,
  setConfig,
  selectedPlayerIds,
  priorityPlayerIds,
  benchPlayerIds,
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
  onToggleBench,
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
  onRestorePresence,
  hasLastPresence,
  canDraw,
  fullTeams,
  playersPerTeam,
  shortForTwoTeams,
  totalSelected,
  matchConfig,
  setMatchConfig,
}) {
  const BenchMark = ({ player, className = '' }) =>
    benchPlayerIds.includes(player.id) ? (
      <Clock size={14} className={cn('text-slate-400 dark:text-slate-500', className)} />
    ) : null;
  return (
    <div className="p-4 pb-32">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 mb-6 hover:text-blue-600 transition-colors dark:text-slate-400"
      >
        <ArrowLeft size={20} /> Voltar
      </button>

      <h1 className="text-2xl font-bold mb-2">Novo Sorteio</h1>
      <p className="text-slate-500 mb-6 text-sm dark:text-slate-400">Selecione quem vai jogar hoje e configure os times.</p>

      {drawResult ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Resultado</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
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
              const color = teamColor(idx);
              return (
                <div key={idx} className={cn('bg-white p-4 rounded-xl shadow-sm border-l-4 dark:bg-slate-800', color.railLight)}>
                  <h3 className={cn('font-bold mb-2', color.label)}>
                    Time {idx + 1} · {team.length} {team.length === 1 ? 'jogador' : 'jogadores'}
                  </h3>
                  <ul className="space-y-1">
                    {team.map(p => (
                      <li key={p.id} className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', color.pip)} />
                        {p.name}
                        {priorityPlayerIds.includes(p.id) && <Star size={14} className="fill-yellow-400 text-yellow-400" />}
                        <BenchMark player={p} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {drawResult.bench.length > 0 && (
              <div className="bg-slate-100 p-4 rounded-xl border-l-4 border-slate-400 dark:bg-slate-800/60 dark:border-slate-600">
                <h3 className="font-bold text-slate-600 mb-2 dark:text-slate-300">
                  Reserva · {drawResult.bench.length} {drawResult.bench.length === 1 ? 'jogador' : 'jogadores'}
                </h3>
                <ul className="space-y-1 text-slate-500 dark:text-slate-400">
                  {drawResult.bench.map(p => (
                    <li key={p.id} className="flex items-center gap-2">
                      {p.name}
                      <BenchMark player={p} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              Placar <Settings size={18} />
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="target-points" className="text-xs font-semibold text-slate-400 uppercase dark:text-slate-500">
                  Pontos por set
                </label>
                <input
                  id="target-points"
                  type="number"
                  min="1"
                  value={matchConfig.targetPoints}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMatchConfig({ ...matchConfig, targetPoints: v === '' ? '' : Math.max(1, parseInt(v, 10) || 1) });
                  }}
                  onBlur={() => {
                    if (matchConfig.targetPoints === '') setMatchConfig({ ...matchConfig, targetPoints: 25 });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-semibold text-slate-400 uppercase dark:text-slate-500">Formato</span>
                <div className="flex gap-1">
                  {[1, 3, 5].map(b => (
                    <button
                      key={b}
                      onClick={() => setMatchConfig({ ...matchConfig, bestOf: b })}
                      className={cn(
                        'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors border',
                        matchConfig.bestOf === b
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                      )}
                    >
                      Bo{b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onDraw}
              className="flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors dark:bg-slate-800 dark:border-blue-500/40 dark:hover:bg-slate-700"
            >
              <RefreshCw size={18} /> Redistribuir
            </button>
            <button
              onClick={onCopyTeams}
              className="flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors dark:bg-slate-800 dark:border-blue-500/40 dark:hover:bg-slate-700"
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
                <label className="text-xs font-semibold text-slate-400 uppercase dark:text-slate-500">Jogadores / Time</label>
                <input
                  type="number"
                  min="1"
                  value={config.playersPerTeam}
                  onChange={(e) => {
                    const v = e.target.value;
                    setConfig({ ...config, playersPerTeam: v === '' ? '' : Math.max(1, parseInt(v, 10) || 1) });
                  }}
                  onBlur={() => {
                    if (config.playersPerTeam === '') setConfig({ ...config, playersPerTeam: 6 });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase dark:text-slate-500">Max. de Times</label>
                <input
                  type="number"
                  min="2"
                  value={config.numTeams}
                  onChange={(e) => {
                    const v = e.target.value;
                    setConfig({ ...config, numTeams: v === '' ? '' : Math.max(2, parseInt(v, 10) || 2) });
                  }}
                  onBlur={() => {
                    if (config.numTeams === '') setConfig({ ...config, numTeams: 2 });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>
              <p className="text-xs text-slate-400 col-span-2 dark:text-slate-500">
                Os times são formados completos até esse limite; quem sobrar fica na reserva.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold">2. Presença</h3>
              <div className="flex gap-3">
                {hasLastPresence && (
                  <button onClick={onRestorePresence} className="text-xs font-medium text-emerald-600">Repetir presença</button>
                )}
                <button onClick={onSelectAllMembers} className="text-xs font-medium text-blue-600">Todos</button>
                <button onClick={onClearMembers} className="text-xs font-medium text-slate-400 dark:text-slate-500">Nenhum</button>
              </div>
            </div>
            {showImport ? (
              <div className="mb-3">
                <textarea
                  rows={4}
                  placeholder={'Cole a lista de quem vai jogar hoje. Ex.:\n1. Ana\n2. Bruno\n3. Carla'}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
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
                    className="bg-slate-200 text-slate-600 text-sm px-4 rounded-lg hover:bg-slate-300 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
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
            <p className="text-xs text-slate-400 mb-3 dark:text-slate-500">
              {totalSelected} selecionados ·{' '}
              {canDraw
                ? `${fullTeams} ${fullTeams === 1 ? 'time completo' : 'times completos'} · ${totalSelected - fullTeams * playersPerTeam} reserva`
                : `faltam ${shortForTwoTeams} para 2 times completos`}
            </p>
            <p className="text-xs text-slate-400 mb-3 dark:text-slate-500">
              Estrela prioriza (Times 1 e 2). Relógio marca reserva — confirmou presença mas ainda não chegou.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto p-1">
              {racha.players.map(player => {
                const isSelected = selectedPlayerIds.includes(player.id);
                const isPriority = priorityPlayerIds.includes(player.id);
                const isBench = benchPlayerIds.includes(player.id);
                return (
                  <div
                    key={player.id}
                    onClick={() => onToggleSelection(player.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggleSelection(player.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`${isSelected ? 'Remover' : 'Selecionar'} ${player.name}`}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer',
                      isSelected
                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                        : 'bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-5 h-5 rounded-md border flex items-center justify-center transition-colors',
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-500'
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
                        isPriority ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-400 dark:text-slate-500'
                      )}
                      title="Prioridade: vai para os Times 1 e 2"
                      aria-label={`${isPriority ? 'Remover prioridade' : 'Priorizar'} ${player.name}`}
                    >
                      <Star size={20} className={isPriority ? 'fill-yellow-500' : ''} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleBench(player.id); }}
                      className={cn(
                        'p-1 rounded-full transition-colors',
                        isBench ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 hover:text-slate-500 dark:text-slate-500'
                      )}
                      title="Reserva: confirmou presença mas ainda não chegou"
                      aria-label={`${isBench ? 'Remover' : 'Marcar'} ${player.name} como reserva`}
                    >
                      <Clock size={20} className={isBench ? 'fill-slate-300 dark:fill-slate-600' : ''} />
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
                aria-label="Nome do convidado"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
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
            <p className="text-xs text-slate-400 mb-2 dark:text-slate-500">Convidados não são salvos na lista do racha.</p>
            <div className="flex flex-wrap gap-2">
              {guests.map(guest => (
                <div key={guest.id} className="flex items-center gap-1 bg-slate-200 px-3 py-1 rounded-full text-sm dark:bg-slate-700">
                  <span className="text-[10px] text-slate-500 uppercase dark:text-slate-400">Convidado</span>
                  {guest.name}
                  <button
                    onClick={() => onPromoteGuest(guest)}
                    className="text-slate-500 hover:text-blue-600 dark:text-slate-400"
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
                    aria-label={`${priorityPlayerIds.includes(guest.id) ? 'Remover prioridade' : 'Priorizar'} ${guest.name}`}
                  >
                    <Star size={14} className={priorityPlayerIds.includes(guest.id) ? 'fill-yellow-600' : ''} />
                  </button>
                  <button
                    onClick={() => onToggleBench(guest.id)}
                    className={cn(
                      benchPlayerIds.includes(guest.id) ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'
                    )}
                    title="Reserva: confirmou presença mas ainda não chegou"
                    aria-label={`${benchPlayerIds.includes(guest.id) ? 'Remover' : 'Marcar'} ${guest.name} como reserva`}
                  >
                    <Clock size={14} className={benchPlayerIds.includes(guest.id) ? 'fill-slate-300 dark:fill-slate-600' : ''} />
                  </button>
                  <button
                    onClick={() => onRemoveGuest(guest.id)}
                    className="text-slate-500 hover:text-red-500 dark:text-slate-400"
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

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 dark:bg-slate-900/80 dark:border-slate-700">
        <div className="max-w-md mx-auto">
          {!drawResult ? (
            <div className="space-y-1">
              <button
                onClick={onDraw}
                disabled={!canDraw}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 disabled:bg-slate-300 disabled:shadow-none transition-all dark:shadow-none dark:disabled:bg-slate-700"
              >
                Sortear Times
              </button>
              {!canDraw && (
                <p className="text-center text-xs text-slate-400 dark:text-slate-500">
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
