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

const withMarker = (name, id, markedIds, marker) =>
  markedIds.includes(id) ? `${name}${marker}` : name;

export function buildTeamsText(rachaName, teams, bench, priorityIds = [], benchIds = []) {
  const lines = [`Sorteio - ${rachaName}`];
  teams.forEach((team, i) => {
    lines.push(`\nTime ${i + 1} (${team.length}):`);
    team.forEach(p => {
      const name = withMarker(p.name, p.id, priorityIds, ' *');
      lines.push(`- ${withMarker(name, p.id, benchIds, ' (reserva)')}`);
    });
  });
  if (bench.length > 0) {
    lines.push(`\nReserva (${bench.length}):`);
    bench.forEach(p => lines.push(`- ${p.name}`));
  }
  return lines.join('\n');
}
