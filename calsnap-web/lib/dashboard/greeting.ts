export function dashboardGreeting(name: string | undefined, now: Date = new Date()): string {
  if (!name?.trim()) {
    return 'Today';
  }

  const hour = now.getHours();
  let prefix: string;
  if (hour >= 5 && hour < 12) {
    prefix = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    prefix = 'Good afternoon';
  } else if (hour >= 17 && hour < 22) {
    prefix = 'Good evening';
  } else {
    prefix = 'Hello';
  }

  return `${prefix}, ${name.trim()}`;
}

export function dashboardFormattedDate(now: Date = new Date()): string {
  return now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
