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
  // Mínimo de 2 times para haver uma partida
  const numTeams = Math.max(2, requestedNumTeams);
  
  // Separa e embaralha para garantir aleatoriedade dentro das categorias
  const priorityPlayers = shuffleArray(players.filter(p => priorityPlayerIds.includes(p.id)));
  const regularPlayers = shuffleArray(players.filter(p => !priorityPlayerIds.includes(p.id)));

  const teams = Array.from({ length: numTeams }, () => []);
  
  // Função auxiliar para distribuir jogadores em times específicos de forma balanceada (round-robin)
  const distributeToTeams = (playerList, teamIndices) => {
    let listIdx = 0;
    // Enquanto houver jogadores e espaço nos times selecionados
    while (listIdx < playerList.length) {
      let addedInRound = false;
      for (const teamIdx of teamIndices) {
        if (listIdx < playerList.length && teams[teamIdx].length < playersPerTeam) {
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

  // 3. Jogadores regulares preenchem as vagas restantes em todos os times
  const allTeamIndices = Array.from({ length: numTeams }, (_, i) => i);
  // Unimos eventuais prioritários que sobraram (caso TODOS os times estejam cheios) com os regulares
  const poolForRest = [...remainingPriority, ...regularPlayers];
  distributeToTeams(poolForRest, allTeamIndices);

  const usedPlayerIds = teams.flat().map(p => p.id);
  const bench = players.filter(p => !usedPlayerIds.includes(p.id));

  return { teams, bench };
}
