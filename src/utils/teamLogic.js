export function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export function drawTeams({
  players,
  playersPerTeam,
  numTeams: requestedNumTeams,
  priorityPlayerIds = []
}) {
  const perTeam = Math.max(1, playersPerTeam);
  const maxTeams = Math.max(1, requestedNumTeams);

  // Times são formados completos até o máximo configurado; o excedente vai pra reserva.
  // Ex.: 15 jogadores com 3x6 -> 2 times de 6 e 3 na reserva.
  const numTeams = Math.min(maxTeams, Math.floor(players.length / perTeam));

  if (numTeams < 2) {
    return { teams: [], bench: players };
  }

  // Separa e embaralha para garantir aleatoriedade dentro das categorias
  const priorityPlayers = shuffleArray(players.filter(p => priorityPlayerIds.includes(p.id)));
  const regularPlayers = shuffleArray(players.filter(p => !priorityPlayerIds.includes(p.id)));

  const teams = Array.from({ length: numTeams }, () => []);

  // Distribui jogadores nos times em rodadas (round-robin) até o limite por time
  const distributeToTeams = (playerList, teamIndices) => {
    let listIdx = 0;
    while (listIdx < playerList.length) {
      let addedInRound = false;
      for (const teamIdx of teamIndices) {
        if (listIdx < playerList.length && teams[teamIdx].length < perTeam) {
          teams[teamIdx].push(playerList[listIdx]);
          listIdx++;
          addedInRound = true;
        }
      }
      // Se deu uma volta completa e não conseguiu adicionar ninguém, os times estão cheios
      if (!addedInRound) break;
    }
    return playerList.slice(listIdx);
  };

  // 1. Prioritários nos times 1 e 2 (se houver mais de 2 times) ou em todos (se houver apenas 2)
  const primaryTeamIndices = numTeams > 2 ? [0, 1] : Array.from({ length: numTeams }, (_, i) => i);
  let remainingPriority = distributeToTeams(priorityPlayers, primaryTeamIndices);

  // 2. Se ainda sobrar prioritários (porque os times 1 e 2 encheram), tenta colocar nos outros times
  if (remainingPriority.length > 0 && numTeams > 2) {
    const otherTeamIndices = Array.from({ length: numTeams - 2 }, (_, i) => i + 2);
    remainingPriority = distributeToTeams(remainingPriority, otherTeamIndices);
  }

  // 3. Regulares (e prioritários que sobraram) preenchem as vagas restantes
  const allTeamIndices = Array.from({ length: numTeams }, (_, i) => i);
  distributeToTeams([...remainingPriority, ...regularPlayers], allTeamIndices);

  const usedPlayerIds = teams.flat().map(p => p.id);
  const bench = players.filter(p => !usedPlayerIds.includes(p.id));

  return { teams, bench };
}
