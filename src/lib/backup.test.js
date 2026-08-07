import { describe, it, expect } from 'vitest';
import { serializeBackup, parseBackup } from './backup';

describe('backup', () => {
  const rachas = [{ id: 'r1', name: 'Racha', players: [] }];

  it('serializes and parses a backup round-trip', () => {
    const text = serializeBackup({ rachas });
    expect(parseBackup(text)).toEqual({ rachas });
  });

  it('rejects invalid backup content', () => {
    expect(() => parseBackup('not json')).toThrow();
    expect(() => parseBackup(JSON.stringify({ matches: [], foo: 1 }))).toThrow();
  });
});
