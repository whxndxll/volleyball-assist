export function serializeBackup({ rachas, matches }) {
  return JSON.stringify(
    { app: 'volei-assist', version: 1, exportedAt: Date.now(), rachas, matches },
    null,
    2
  );
}

export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.rachas) || !Array.isArray(data.matches)) {
    throw new Error('Formato de backup inválido');
  }
  return { rachas: data.rachas, matches: data.matches };
}
