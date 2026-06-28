import { describe, expect, it } from 'vitest';
import {
  dateFromLocalDateInput,
  toLocalDateInputValue,
} from '@/lib/utilities/date-input';

describe('date-input', () => {
  it('round-trips local calendar date', () => {
    const date = new Date(1991, 5, 14, 15, 30, 0);
    const inputValue = toLocalDateInputValue(date);
    expect(inputValue).toBe('1991-06-14');
    expect(dateFromLocalDateInput(inputValue).getFullYear()).toBe(1991);
    expect(dateFromLocalDateInput(inputValue).getMonth()).toBe(5);
    expect(dateFromLocalDateInput(inputValue).getDate()).toBe(14);
  });
});
