'use client';

import { Search, X } from 'lucide-react';
import { copy } from '@/lib/copy';
import { formFieldInputClassName } from '@/lib/design/form-field';
import { scrollFormFieldIntoView } from '@/lib/hooks/use-keyboard-inset';
import { cn } from '@/lib/utils/cn';

interface FavoritesSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function FavoritesSearchBar({ value, onChange }: FavoritesSearchBarProps) {
  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cs-muted"
      />
      <label htmlFor="favorites-search" className="sr-only">
        {copy('mealLog.favorites.searchLabel')}
      </label>
      <input
        id="favorites-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={scrollFormFieldIntoView}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        placeholder={copy('mealLog.favorites.searchPlaceholder')}
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        className={cn(formFieldInputClassName, 'pl-9 pr-9')}
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={copy('mealLog.favorites.clearSearch')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-cs-muted transition-colors hover:text-cs-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cs-primary"
        >
          <X aria-hidden className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
