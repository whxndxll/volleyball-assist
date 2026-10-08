import { describe, it, expect } from 'vitest';
import { matchElapsedMs, formatElapsed, matchStatus, setScores, teamColor } from './match';

const withScore = (aPoints, aSets, bPoints, bSets, extra = {}) => ({
  targetPoints: 25,
  bestOf: 3,
  finished: false,
  teams: [
    { id: 't1', name: 'Time 1', points: aPoints, sets: aSets },
    { id: 't2', name: 'Time 2', points: bPoints, sets: bSets },
  ],
  ...extra,
});

describe('matchElapsedMs', () => {
  it('accumulates elapsed time from the resume base', () => {
    const match = { startedAt: 1000, resumedAt: 1000, accumulatedMs: 0, paused: false };
    expect(matchElapsedMs(match, 5000)).toBe(4000);
  });

  it('adds previous accumulated time to a resumed session', () => {
    const match = { startedAt: 0, resumedAt: 10000, accumulatedMs: 9000, paused: false };
    expect(matchElapsedMs(match, 12000)).toBe(11000);
  });

  it('freezes the time while paused', () => {
    const match = { startedAt: 0, resumedAt: 5000, accumulatedMs: 5000, paused: true };
    expect(matchElapsedMs(match, 9000)).toBe(5000);
  });

  it('freezes the time once finished', () => {
    const match = { startedAt: 0, resumedAt: 0, accumulatedMs: 8000, finished: true };
    expect(matchElapsedMs(match, 20000)).toBe(8000);
  });

  it('returns 0 without a match', () => {
    expect(matchElapsedMs(null, 1000)).toBe(0);
  });
});

describe('formatElapsed', () => {
  it('formats as mm:ss', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(65000)).toBe('01:05');
  });

  it('formats as h:mm:ss past one hour', () => {
    expect(formatElapsed(3661000)).toBe('1:01:01');
  });
});

describe('matchStatus', () => {
  it('stays silent while the set is far from the target', () => {
    expect(matchStatus(withScore(10, 0, 8, 0))).toBeNull();
  });

  it('reports a single deuce instead of one per team', () => {
    expect(matchStatus(withScore(24, 0, 24, 0))).toEqual({ tone: 'neutral', label: 'Deuce' });
  });

  it('names the leading team on set point', () => {
    expect(matchStatus(withScore(24, 0, 22, 0))).toEqual({
      tone: 'set',
      label: 'Set point — Time 1',
    });
  });

  it('escalates to match point on the last set', () => {
    expect(matchStatus(withScore(24, 1, 22, 1))).toEqual({
      tone: 'match',
      label: 'Match point — Time 1',
    });
  });

  it('goes silent once the match is over', () => {
    expect(matchStatus(withScore(25, 2, 20, 1, { finished: true }))).toBeNull();
  });
});

describe('setScores', () => {
  it('tolerates matches saved before set history existed', () => {
    expect(setScores(withScore(3, 0, 1, 0))).toEqual([]);
    expect(setScores(null)).toEqual([]);
  });
});

describe('teamColor', () => {
  it('wraps around instead of returning undefined', () => {
    expect(teamColor(0)).toBe(teamColor(6));
  });
});
