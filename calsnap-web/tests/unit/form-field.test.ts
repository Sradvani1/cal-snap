import { describe, expect, it } from 'vitest';

import { formFieldInputClassName } from '@/lib/design/form-field';

describe('formFieldInputClassName', () => {
  it('uses 16px base font on mobile with sm:text-sm at larger breakpoints', () => {
    expect(formFieldInputClassName).toContain('text-base');
    expect(formFieldInputClassName).toContain('sm:text-sm');
  });

  it('includes the shared focus ring', () => {
    expect(formFieldInputClassName).toContain('focus-visible:ring-2');
    expect(formFieldInputClassName).toContain('focus-visible:ring-cs-primary');
  });
});
