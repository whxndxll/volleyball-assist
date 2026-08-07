export function serializeBackup({ rachas }) {
  return JSON.stringify(
    { app: 'volei-assist', version: 2, exportedAt: Date.now(), rachas },
    null,
    2
  );
}

export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.rachas)) {
    throw new Error('Formato de backup inválido');
  }
  return { rachas: data.rachas };
}
