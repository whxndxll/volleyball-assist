export function serializeBackup({ rachas }) {
  return JSON.stringify(
    { app: 'volei-assist', version: 2, exportedAt: Date.now(), rachas },
    null,
    2
  );
}

const SUPPORTED_VERSION = 2;

export function parseBackup(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.rachas)) {
    throw new Error('Formato de backup inválido');
  }
  if (typeof data.version !== 'number' || data.version > SUPPORTED_VERSION) {
    throw new Error('Versão de backup não suportada');
  }
  return { rachas: data.rachas };
}
