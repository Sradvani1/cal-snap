import { copy } from '@/lib/copy';

export function dashboardGreeting(name: string | undefined, now: Date = new Date()): string {
  if (!name?.trim()) {
    return copy('dashboard.greeting.today');
  }

  const hour = now.getHours();
  const trimmed = name.trim();

  if (hour >= 5 && hour < 12) {
    return copy('dashboard.greeting.morning', { name: trimmed });
  }
  if (hour >= 12 && hour < 17) {
    return copy('dashboard.greeting.afternoon', { name: trimmed });
  }
  if (hour >= 17 && hour < 22) {
    return copy('dashboard.greeting.evening', { name: trimmed });
  }
  return copy('dashboard.greeting.hello', { name: trimmed });
}

export function dashboardFormattedDate(now: Date = new Date()): string {
  return now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
