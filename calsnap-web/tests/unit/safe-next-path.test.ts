import { describe, expect, it } from 'vitest';
import { safeNextPath } from '@/lib/auth/safe-next-path';

describe('safeNextPath', () => {
  it('allows same-origin paths', () => {
    expect(safeNextPath('/share/abc')).toBe('/share/abc');
    expect(safeNextPath('/log/meal-1')).toBe('/log/meal-1');
  });

  it('rejects missing or external targets', () => {
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath('')).toBeNull();
    expect(safeNextPath('https://evil.example')).toBeNull();
    expect(safeNextPath('//evil.example')).toBeNull();
    expect(safeNextPath('/\\evil.example')).toBeNull();
  });

  it('rejects control characters that browsers strip before resolving', () => {
    expect(safeNextPath('/\t/evil.example')).toBeNull();
    expect(safeNextPath('/\n/evil.example')).toBeNull();
  });
});
