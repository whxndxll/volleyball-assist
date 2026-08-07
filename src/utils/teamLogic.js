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
  priorityPlayerIds = [],
  benchPlayerIds = []
}) {
  const perTeam = Math.max(1, playersPerTeam);
  const maxTeams = Math.max(1, requestedNumTeams);

  // Times são formados completos até o máximo configurado; o excedente vai pra reserva.
  // Ex.: 15 jogadores com 3x6 -> 2 times de 6 e 3 na reserva.
  const numTeams = Math.min(maxTeams, Math.floor(players.length / perTeam));

  if (numTeams < 2) {
    return { teams: [], bench: players };
  }

  // Presentes formam os times 1 e 2 (prioridade primeiro); quem marcou "reserva"
  // (confirmou presença mas ainda não chegou) completa as vagas restantes no último
  // time — se der para formar um time completo — caso contrário fica na reserva.
  const priorityPlayers = shuffleArray(players.filter(p => priorityPlayerIds.includes(p.id)));
  const regularPlayers = shuffleArray(players.filter(p => !priorityPlayerIds.includes(p.id) && !benchPlayerIds.includes(p.id)));
  const benchMarkedPlayers = shuffleArray(players.filter(p => benchPlayerIds.includes(p.id)));

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

  const primaryTeamIndices = numTeams > 2 ? [0, 1] : Array.from({ length: numTeams }, (_, i) => i);
  const otherTeamIndices = Array.from({ length: Math.max(0, numTeams - 2) }, (_, i) => i + 2);
  const allTeamIndices = Array.from({ length: numTeams }, (_, i) => i);

  // 1. Prioritários nos times 1 e 2 (ou em todos, se houver apenas 2)
  let remainingPriority = distributeToTeams(priorityPlayers, primaryTeamIndices);

  // 2. Excedente de prioritários vai para os outros times
  if (remainingPriority.length > 0 && otherTeamIndices.length > 0) {
    remainingPriority = distributeToTeams(remainingPriority, otherTeamIndices);
  }

  // 3. Presentes completam os times 1 e 2; o excedente vai para os outros times
  let remainingRegular = distributeToTeams(regularPlayers, primaryTeamIndices);
  if (remainingRegular.length > 0 && otherTeamIndices.length > 0) {
    remainingRegular = distributeToTeams(remainingRegular, otherTeamIndices);
  }

  // 4. Quem ainda não chegou completa as vagas restantes, preferindo o último time
  distributeToTeams([...remainingPriority, ...remainingRegular, ...benchMarkedPlayers], [...allTeamIndices].reverse());

  const usedPlayerIds = teams.flat().map(p => p.id);
  const bench = players.filter(p => !usedPlayerIds.includes(p.id));

  return { teams, bench };
}
