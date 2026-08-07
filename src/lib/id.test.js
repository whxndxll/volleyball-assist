import { describe, it, expect } from 'vitest';
import { uuid } from './id';

describe('uuid', () => {
  it('returns a randomUUID when available', () => {
    expect(uuid()).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('falls back to a v4-style id when crypto.randomUUID is missing', () => {
    const original = crypto.randomUUID;
    delete crypto.randomUUID;
    try {
      const id = uuid();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
      expect(uuid()).not.toBe(id);
    } finally {
      crypto.randomUUID = original;
    }
  });
});
