import { startOfLocalDay } from '@/lib/dashboard/date-window';
import { readStoredDate, storeDate } from '@/lib/dashboard/plateau-state';

export function weighInSnoozeKey(uid: string): string {
  return `weighInSnoozeUntil-${uid}`;
}

export function snoozeWeighInUntilTomorrow(uid: string, now: Date = new Date()): void {
  const tomorrow = startOfLocalDay(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  storeDate(weighInSnoozeKey(uid), tomorrow);
}

export function isWeighInSnoozed(uid: string, now: Date = new Date()): boolean {
  const endDate = readStoredDate(weighInSnoozeKey(uid));
  return endDate !== null && endDate > now;
}
