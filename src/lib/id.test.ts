import { newId } from './id';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('newId', () => {
  it('returns unique v4 UUIDs', () => {
    const ids = Array.from({ length: 50 }, newId);
    expect(new Set(ids).size).toBe(50);
    for (const id of ids) expect(id).toMatch(UUID_V4);
  });

  it('works without crypto.randomUUID (insecure contexts)', () => {
    const original = crypto.randomUUID;
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    try {
      expect(newId()).toMatch(UUID_V4);
    } finally {
      Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true });
    }
  });
});
