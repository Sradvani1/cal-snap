import { describe, expect, it } from 'vitest';

import { isEditableElement } from '@/lib/hooks/use-keyboard-active-viewport';

describe('isEditableElement', () => {
  it('returns false for null', () => {
    expect(isEditableElement(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isEditableElement(undefined)).toBe(false);
  });

  it('returns true for <input>', () => {
    expect(isEditableElement({ tagName: 'INPUT' })).toBe(true);
  });

  it('returns true for <textarea>', () => {
    expect(isEditableElement({ tagName: 'TEXTAREA' })).toBe(true);
  });

  it('returns true for [contenteditable=true]', () => {
    expect(isEditableElement({ tagName: 'DIV', isContentEditable: true })).toBe(true);
  });

  it('returns false for non-editable <div>', () => {
    expect(isEditableElement({ tagName: 'DIV' })).toBe(false);
  });
});
