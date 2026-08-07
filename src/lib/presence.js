export function parsePresenceNames(text) {
  return text
    .split('\n')
    .map(line => line
      .replace(/^\s*[-*•·]?\s*/, '')
      .replace(/^\d+[.)\-–]?\s*/, '')
      .trim()
    )
    .filter(Boolean);
}

export function stripCaptainMark(name) {
  return name.replace(/\s*\(C\)$/, '').trim();
}

export function buildTeamsText(rachaName, teams, bench, priorityIds) {
  const lines = [`Sorteio - ${rachaName}`];
  teams.forEach((team, i) => {
    lines.push(`\nTime ${i + 1} (${team.length}):`);
    team.forEach(p => lines.push(`- ${p.name}${priorityIds.includes(p.id) ? ' *' : ''}`));
  });
  if (bench.length > 0) {
    lines.push(`\nReserva (${bench.length}):`);
    bench.forEach(p => lines.push(`- ${p.name}`));
  }
  return lines.join('\n');
}
