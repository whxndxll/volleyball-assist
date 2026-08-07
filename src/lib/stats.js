import { setsToWin } from './match';

export function computePlayerStats(matches) {
  const byPlayer = new Map();
  let totalMatches = 0;
  let totalSets = 0;

  for (const match of matches) {
    if (!match.finished) continue;
    totalMatches++;
    const winner = match.teams.find(t => t.sets >= setsToWin(match));
    for (const team of match.teams) {
      totalSets += team.sets;
      for (const player of team.players) {
        let record = byPlayer.get(player.id);
        if (!record) {
          record = { id: player.id, name: player.name, jogos: 0, vitorias: 0 };
          byPlayer.set(player.id, record);
        }
        record.jogos++;
        if (winner && team.id === winner.id) record.vitorias++;
      }
    }
  }

  const players = [...byPlayer.values()].map(p => ({
    ...p,
    aproveitamento: p.jogos > 0 ? Math.round((p.vitorias / p.jogos) * 100) : 0,
  }));
  players.sort((a, b) => b.jogos - a.jogos || b.vitorias - a.vitorias || a.name.localeCompare(b.name));

  return { players, totalMatches, totalSets };
}
