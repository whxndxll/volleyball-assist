import { describe, it, expect } from 'vitest';
import { computePlayerStats } from './stats';

const player = (id, name) => ({ id, name });

const team = (id, players, sets) => ({
  id,
  name: `Time ${id}`,
  players,
  points: 25,
  sets,
});

const finished = (id, teams, overrides = {}) => ({
  id,
  rachaId: 'r1',
  createdAt: 1,
  targetPoints: 25,
  bestOf: 3,
  finished: true,
  teams,
  ...overrides,
});

describe('computePlayerStats', () => {
  it('ignores matches that are not finished', () => {
    const stats = computePlayerStats([
      finished('m1', [team('t1', [player('a', 'Ana')], 2), team('t2', [player('b', 'Bia')], 0)], { finished: false }),
    ]);
    expect(stats.totalMatches).toBe(0);
    expect(stats.totalSets).toBe(0);
    expect(stats.players).toHaveLength(0);
  });

  it('counts games, sets and wins per player', () => {
    const stats = computePlayerStats([
      finished('m1', [
        team('t1', [player('a', 'Ana'), player('b', 'Bia')], 2),
        team('t2', [player('c', 'Carla'), player('d', 'Duda')], 0),
      ]),
    ]);
    expect(stats.totalMatches).toBe(1);
    expect(stats.totalSets).toBe(2);
    expect(stats.players).toHaveLength(4);

    const ana = stats.players.find(p => p.id === 'a');
    expect(ana.jogos).toBe(1);
    expect(ana.vitorias).toBe(1);
    expect(ana.aproveitamento).toBe(100);

    const carla = stats.players.find(p => p.id === 'c');
    expect(carla.jogos).toBe(1);
    expect(carla.vitorias).toBe(0);
    expect(carla.aproveitamento).toBe(0);
  });

  it('aggregates stats across multiple matches', () => {
    const stats = computePlayerStats([
      finished('m1', [team('t1', [player('a', 'Ana')], 2), team('t2', [player('b', 'Bia')], 0)]),
      finished('m2', [team('t1', [player('a', 'Ana')], 0), team('t2', [player('b', 'Bia')], 2)]),
    ]);
    const ana = stats.players.find(p => p.id === 'a');
    expect(ana.jogos).toBe(2);
    expect(ana.vitorias).toBe(1);
    expect(ana.aproveitamento).toBe(50);
  });

  it('sorts players by games played, then wins, then name', () => {
    const stats = computePlayerStats([
      finished('m1', [team('t1', [player('a', 'Ana'), player('b', 'Bia')], 2), team('t2', [player('c', 'Carla')], 0)]),
      finished('m2', [team('t1', [player('a', 'Ana'), player('b', 'Bia')], 0), team('t2', [player('c', 'Carla')], 2)]),
      finished('m3', [team('t1', [player('c', 'Carla')], 2), team('t2', [player('d', 'Duda')], 0)]),
    ]);
    const ids = stats.players.map(p => p.id);
    expect(ids[0]).toBe('c');
    expect(ids.indexOf('a')).toBeLessThan(ids.indexOf('b'));
  });
});
