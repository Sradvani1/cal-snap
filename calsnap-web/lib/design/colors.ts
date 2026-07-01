import type { CalorieProgressBand, FiberProgressBand } from '@/lib/dashboard/calorie-progress';
import type { ConfidenceLevel } from '@/lib/scanner/meal-totals';

/** Light-mode hex values from iOS Assets.xcassets */
export const lightColors = {
  primary: '#3DA35D',
  secondary: '#1A6B6B',
  accent: '#E6A817',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  foreground: '#1C1C1E',
  muted: '#6B7280',
  border: '#E5E5EA',
  success: '#34C759',
  warning: '#FFCC00',
  danger: '#FF3B30',
  protein: '#007AFF',
  carbs: '#FF9500',
  fat: '#AF52DE',
  onPrimary: '#FFFFFF',
} as const;

/** Dark-mode hex values from iOS Assets.xcassets */
export const darkColors = {
  primary: '#5BC97A',
  secondary: '#2A9B9B',
  accent: '#F0C040',
  background: '#000000',
  surface: '#1C1C1E',
  foreground: '#F5F5F7',
  muted: '#98989D',
  border: '#38383A',
  success: '#30D158',
  warning: '#FFD60A',
  danger: '#FF453A',
  protein: '#4099FF',
  carbs: '#FF9F0A',
  fat: '#BF5AF2',
  onPrimary: '#FFFFFF',
} as const;

export type ChartColorPalette = typeof lightColors | typeof darkColors;

export function calorieProgressColor(band: CalorieProgressBand): string {
  switch (band) {
    case 'under':
      return 'var(--cs-success)';
    case 'onTrack':
      return 'var(--cs-warning)';
    case 'over':
      return 'var(--cs-danger)';
  }
}

export function calorieProgressStrokeClass(band: CalorieProgressBand): string {
  switch (band) {
    case 'under':
      return 'stroke-cs-success';
    case 'onTrack':
      return 'stroke-cs-warning';
    case 'over':
      return 'stroke-cs-danger';
  }
}

export function fiberProgressColor(band: FiberProgressBand): string {
  switch (band) {
    case 'onTrack':
      return 'var(--cs-success)';
    case 'moderate':
      return 'var(--cs-warning)';
    case 'low':
      return 'var(--cs-danger)';
  }
}

export function fiberProgressBarClass(band: FiberProgressBand): string {
  switch (band) {
    case 'onTrack':
      return 'bg-cs-success';
    case 'moderate':
      return 'bg-cs-warning';
    case 'low':
      return 'bg-cs-danger';
  }
}

export function confidenceBadgeStyles(level: ConfidenceLevel): {
  container: string;
  highContrastBorder?: string;
} {
  switch (level) {
    case 'high':
      return {
        container: 'bg-cs-success/15 text-cs-success',
        highContrastBorder: 'border border-cs-success',
      };
    case 'medium':
      return {
        container: 'bg-cs-warning/15 text-cs-warning',
        highContrastBorder: 'border border-cs-warning',
      };
    case 'low':
      return {
        container: 'bg-cs-danger/15 text-cs-danger',
        highContrastBorder: 'border border-cs-danger',
      };
    case 'manual':
      return {
        container: 'bg-cs-muted/15 text-cs-muted',
        highContrastBorder: 'border border-cs-muted',
      };
  }
}
