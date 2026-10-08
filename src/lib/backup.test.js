import { describe, it, expect } from 'vitest';
import { serializeBackup, parseBackup, SUPPORTED_VERSION } from './backup';

describe('backup', () => {
  const rachas = [{ id: 'r1', name: 'Racha', players: [] }];
  const matchHistory = [
    { id: 'm1', endedAt: 1, teams: [{ id: 't1', name: 'A', sets: 2 }, { id: 't2', name: 'B', sets: 1 }] },
  ];

  it('serializes and parses a backup round-trip', () => {
    const text = serializeBackup({ rachas, matchHistory });
    expect(parseBackup(text)).toEqual({ rachas, matchHistory });
  });

  it('keeps the match history in the exported file', () => {
    expect(JSON.parse(serializeBackup({ rachas, matchHistory })).matchHistory).toEqual(matchHistory);
  });

  it('defaults the history to empty when it is not given', () => {
    expect(JSON.parse(serializeBackup({ rachas })).matchHistory).toEqual([]);
  });

  it('rejects invalid backup content', () => {
    expect(() => parseBackup('not json')).toThrow();
    expect(() => parseBackup(JSON.stringify({ matches: [], foo: 1 }))).toThrow();
  });

  it('rejects a version newer than the app understands', () => {
    const future = JSON.stringify({ version: SUPPORTED_VERSION + 1, rachas });
    expect(() => parseBackup(future)).toThrow(/não suportada/);
  });

  it('rejects a racha without an id or a name', () => {
    expect(() => parseBackup(JSON.stringify({ version: 2, rachas: [{ players: [] }] }))).toThrow();
    expect(() => parseBackup(JSON.stringify({ version: 2, rachas: [{ id: 'r1', players: [] }] }))).toThrow();
  });

  it('rejects a racha whose players are not a list of valid players', () => {
    const notAList = JSON.stringify({ version: 2, rachas: [{ id: 'r1', name: 'Racha', players: 'ana' }] });
    const badPlayer = JSON.stringify({ version: 2, rachas: [{ id: 'r1', name: 'Racha', players: [{ name: 'Ana' }] }] });
    expect(() => parseBackup(notAList)).toThrow();
    expect(() => parseBackup(badPlayer)).toThrow();
  });

  it('accepts the version 1 shape, which carried rachas the same way', () => {
    const v1 = JSON.stringify({ app: 'volei-assist', version: 1, rachas, matches: [] });
    expect(parseBackup(v1)).toEqual({ rachas, matchHistory: [] });
  });

  it('rejects a match history entry with no teams', () => {
    const bad = JSON.stringify({ version: 2, rachas, matchHistory: [{ id: 'm1' }] });
    expect(() => parseBackup(bad)).toThrow(/partidas inválidas/);
  });
});
