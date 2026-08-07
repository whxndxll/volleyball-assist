import { ArrowLeft, Users, Trophy } from 'lucide-react';

export default function RachaDetail({
  racha,
  activeMatch,
  matchesCount,
  onBack,
  onPlayers,
  onMatches,
  onNewDraw,
}) {
  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 mb-6 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={20} /> Meus Rachas
      </button>

      <header className="mb-8">
        <h1 className="text-2xl font-bold">{racha.name}</h1>
        <p className="text-slate-500">O que você deseja fazer hoje?</p>
      </header>

      <div className="grid gap-4">
        <button
          onClick={onPlayers}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 items-start hover:border-blue-200 transition-all"
        >
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <Users size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">Jogadores</h3>
            <p className="text-sm text-slate-500">Gerencie a lista de membros fixos do racha ({racha.players.length})</p>
          </div>
        </button>

        <button
          onClick={onMatches}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 items-start hover:border-emerald-200 transition-all"
        >
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
            <Trophy size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg">Partidas</h3>
            <p className="text-sm text-slate-500">
              {activeMatch
                ? 'Placar em andamento'
                : matchesCount > 0
                  ? `${matchesCount} partida(s) registrada(s)`
                  : 'Placares e histórico'}
            </p>
          </div>
        </button>

        <button
          onClick={onNewDraw}
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
