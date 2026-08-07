import { describe, it, expect } from 'vitest';
import { drawTeams, shuffleArray } from './teamLogic';

const player = (id) => ({ id, name: `P${id}` });

const allPlayers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'].map(player);

describe('shuffleArray', () => {
  it('returns a new array with the same elements', () => {
    const input = [1, 2, 3, 4, 5];
    const output = shuffleArray(input);
    expect(output).not.toBe(input);
    expect([...output].sort()).toEqual([...input].sort());
  });

  it('does not mutate the input array', () => {
    const input = [1, 2, 3];
    shuffleArray(input);
    expect(input).toEqual([1, 2, 3]);
  });
});

describe('drawTeams', () => {
  it('returns all players on the bench when fewer than 2 teams fit', () => {
    const result = drawTeams({ players: allPlayers.slice(0, 6), playersPerTeam: 6, numTeams: 2 });
    expect(result.teams).toEqual([]);
    expect(result.bench).toHaveLength(6);
  });

  it('forms full teams up to maxTeams and sends the rest to the bench', () => {
    const result = drawTeams({ players: allPlayers.slice(0, 10), playersPerTeam: 2, numTeams: 3 });
    expect(result.teams).toHaveLength(3);
    expect(result.teams.every(t => t.length === 2)).toBe(true);
    expect(result.bench).toHaveLength(4);
  });

  it('fills every team completely when there are enough players', () => {
    const result = drawTeams({ players: allPlayers, playersPerTeam: 6, numTeams: 3 });
    expect(result.teams).toHaveLength(2);
    expect(result.teams.every(t => t.length === 6)).toBe(true);
    expect(result.bench).toHaveLength(4);
  });

  it('never duplicates or loses players', () => {
    const result = drawTeams({ players: allPlayers, playersPerTeam: 4, numTeams: 3 });
    const allDrawn = [...result.teams.flat(), ...result.bench].map(p => p.id);
    expect(allDrawn).toHaveLength(allPlayers.length);
    expect(new Set(allDrawn).size).toBe(allPlayers.length);
  });

  it('keeps prioritized players out of the bench when there is space', () => {
    const priorityPlayerIds = ['A', 'B', 'C', 'D'];
    const result = drawTeams({ players: allPlayers, playersPerTeam: 6, numTeams: 2, priorityPlayerIds });
    expect(result.bench).toHaveLength(4);
    expect(result.bench.map(p => p.id)).not.toEqual(expect.arrayContaining(priorityPlayerIds));
  });

  it('prioritized players are distributed between teams 1 and 2', () => {
    const priorityPlayerIds = ['A', 'B', 'C', 'D'];
    const result = drawTeams({ players: allPlayers, playersPerTeam: 6, numTeams: 2, priorityPlayerIds });
    const firstTwoTeams = [...result.teams[0], ...result.teams[1]].map(p => p.id);
    for (const id of priorityPlayerIds) {
      expect(firstTwoTeams).toContain(id);
    }
  });
});
