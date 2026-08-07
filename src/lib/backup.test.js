import { describe, it, expect } from 'vitest';
import { serializeBackup, parseBackup } from './backup';

describe('backup', () => {
  const rachas = [{ id: 'r1', name: 'Racha', players: [] }];
  const matches = [{ id: 'm1', rachaId: 'r1', teams: [] }];

  it('serializes and parses a backup round-trip', () => {
    const text = serializeBackup({ rachas, matches });
    expect(parseBackup(text)).toEqual({ rachas, matches });
  });

  it('rejects invalid backup content', () => {
    expect(() => parseBackup('not json')).toThrow();
    expect(() => parseBackup(JSON.stringify({ rachas: [], foo: 1 }))).toThrow();
  });
});
