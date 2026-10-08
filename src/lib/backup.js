export const SUPPORTED_VERSION = 2;

export function serializeBackup({ rachas, matchHistory = [] }) {
  return JSON.stringify(
    { app: 'volei-assist', version: 2, exportedAt: Date.now(), rachas, matchHistory },
    null,
    2
  );
}

// O arquivo importado é gravado direto no IndexedDB, e um racha sem `players`
// quebra a lista de jogadores e o sorteio na hora do uso, sem volta. Validar
// aqui é o que impede que um arquivo ruim vire dado permanente.
const isPlayer = (p) =>
  Boolean(p) && typeof p.id === 'string' && typeof p.name === 'string';

const isRacha = (r) =>
  Boolean(r) &&
  typeof r.id === 'string' &&
  typeof r.name === 'string' &&
  Array.isArray(r.players) &&
  r.players.every(isPlayer);

const isFinishedMatch = (m) =>
  Boolean(m) &&
  typeof m.id === 'string' &&
  Array.isArray(m.teams) &&
  m.teams.every(t => Boolean(t) && typeof t.id === 'string' && typeof t.name === 'string');

export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.rachas)) {
    throw new Error('Formato de backup inválido');
  }
  if (typeof data.version !== 'number' || data.version > SUPPORTED_VERSION) {
    throw new Error('Versão de backup não suportada');
  }
  if (!data.rachas.every(isRacha)) {
    throw new Error('Backup contém rachas ou jogadores inválidos');
  }
  // Backups anteriores ao histórico não trazem o campo; absence não é erro.
  const matchHistory = data.matchHistory ?? [];
  if (!Array.isArray(matchHistory) || !matchHistory.every(isFinishedMatch)) {
    throw new Error('Backup contém partidas inválidas');
  }
  return { rachas: data.rachas, matchHistory };
}