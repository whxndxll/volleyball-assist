import { describe, it, expect } from 'vitest';
import { parsePresenceNames, stripCaptainMark, buildTeamsText } from './presence';

describe('parsePresenceNames', () => {
  it('parses numbered, bulleted and plain lines', () => {
    const names = parsePresenceNames('1. Ana\n- Bruno\n• Carla\n\nDuda\n2) Eva');
    expect(names).toEqual(['Ana', 'Bruno', 'Carla', 'Duda', 'Eva']);
  });

  it('ignores empty lines', () => {
    expect(parsePresenceNames('\n  \nAna\n')).toEqual(['Ana']);
  });

  it('does not mutate input text', () => {
    expect(parsePresenceNames('Ana (C)\n')).toEqual(['Ana (C)']);
  });
});

describe('stripCaptainMark', () => {
  it('removes a trailing (C) marker', () => {
    expect(stripCaptainMark('Ana (C)')).toBe('Ana');
    expect(stripCaptainMark('Ana')).toBe('Ana');
  });
});

describe('buildTeamsText', () => {
  it('builds a formatted team list with bench and priority markers', () => {
    const text = buildTeamsText(
      'Racha X',
      [
        [{ name: 'Ana', id: 'a' }],
        [{ name: 'Bia', id: 'b' }],
      ],
      [{ name: 'Carla', id: 'c' }],
      ['a'],
      ['b']
    );
    expect(text).toContain('Sorteio - Racha X');
    expect(text).toContain('- Ana *');
    expect(text).toContain('- Bia (reserva)');
    expect(text).toContain('Reserva (1):');
    expect(text).toContain('- Carla');
  });
});
