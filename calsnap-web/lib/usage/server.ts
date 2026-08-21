import { createHmac } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { type UsageEventName, UsageEvent } from '@/lib/usage/events';

const DAILY_COLLECTION = 'internalUsageDaily';
const DEDUPE_COLLECTION = 'internalUsageDedupe';
const DEDUPE_RETENTION_DAYS = 35;
const USAGE_TIME_ZONE = 'America/Los_Angeles';
const usageDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: USAGE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
export const USAGE_SHARD_COUNT = 10;
export const MAX_EVENTS_PER_USER_PER_DAY = 100;

export interface UsageDailyRecord {
  date: string;
  activeUsers: number;
  eventCounts: Partial<Record<UsageEventName, number>>;
}

export interface UsageSummary {
  days: UsageDailyRecord[];
  totals: {
    activeUsers: number;
    eventCounts: Partial<Record<UsageEventName, number>>;
  };
}

function usageHashSecret(): string {
  const secret = process.env.USAGE_ANALYTICS_HASH_SECRET?.trim();
  if (!secret) {
    throw new Error('USAGE_ANALYTICS_HASH_SECRET is not configured');
  }
  return secret;
}

function usageStartDate(): string {
  const configured = process.env.USAGE_ANALYTICS_START_DATE?.trim();
  return configured && /^\d{4}-\d{2}-\d{2}$/.test(configured)
    ? configured
    : '1970-01-01';
}

export function pacificDateKey(date = new Date()): string {
  const parts = usageDateFormatter.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function dailyUserHash(uid: string, date: string): string {
  return createHmac('sha256', usageHashSecret())
    .update(`${date}:${uid}`)
    .digest('hex');
}

function shardId(userHash: string): number {
  return Number.parseInt(userHash.slice(0, 2), 16) % USAGE_SHARD_COUNT;
}

function dateKeys(days: number, referenceDate = new Date()): string[] {
  const today = new Date(`${pacificDateKey(referenceDate)}T12:00:00.000Z`);
  const keys: string[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - offset);
    const key = date.toISOString().slice(0, 10);
    if (key >= usageStartDate()) {
      keys.push(key);
    }
  }
  return keys;
}

export function canRecordUsageEvent(acceptedEventCount: unknown): boolean {
  return typeof acceptedEventCount !== 'number' || acceptedEventCount < MAX_EVENTS_PER_USER_PER_DAY;
}

export async function recordUsageEvent(uid: string, event: UsageEventName): Promise<boolean> {
  const date = pacificDateKey();
  if (date < usageStartDate()) {
    return false;
  }
  const db = getAdminFirestore();
  const userHash = dailyUserHash(uid, date);
  const dailyRef = db.collection(DAILY_COLLECTION).doc(`${date}_${shardId(userHash)}`);
  const dedupeRef = db.collection(DEDUPE_COLLECTION).doc(`${date}_${userHash}`);

  return db.runTransaction(async (transaction) => {
    const dedupe = await transaction.get(dedupeRef);
    const acceptedEventCount = dedupe.exists
      ? dedupe.data()?.acceptedEventCount
      : 0;
    if (!canRecordUsageEvent(acceptedEventCount)) {
      return false;
    }

    transaction.set(
      dailyRef,
      {
        date,
        updatedAt: FieldValue.serverTimestamp(),
        eventCounts: { [event]: FieldValue.increment(1) },
        ...(dedupe.exists ? {} : { activeUsers: FieldValue.increment(1) }),
      },
      { merge: true },
    );

    transaction.set(
      dedupeRef,
      {
        acceptedEventCount: FieldValue.increment(1),
        ...(dedupe.exists
          ? {}
          : { expiresAt: Timestamp.fromMillis(Date.now() + DEDUPE_RETENTION_DAYS * 86_400_000) }),
      },
      { merge: true },
    );
    return true;
  });
}

function eventCounts(value: unknown): Partial<Record<UsageEventName, number>> {
  if (typeof value !== 'object' || value === null) {
    return {};
  }

  const counts: Partial<Record<UsageEventName, number>> = {};
  for (const event of Object.values(UsageEvent)) {
    const count = (value as Record<string, unknown>)[event];
    if (typeof count === 'number' && Number.isFinite(count) && count > 0) {
      counts[event] = count;
    }
  }
  return counts;
}

function usageEventCounts(shard: Record<string, unknown>): Partial<Record<UsageEventName, number>> {
  const counts = eventCounts(shard.eventCounts);
  for (const event of Object.values(UsageEvent)) {
    if (counts[event] !== undefined) {
      continue;
    }
    const legacyCount = shard[`eventCounts.${event}`];
    if (typeof legacyCount === 'number' && Number.isFinite(legacyCount) && legacyCount > 0) {
      counts[event] = legacyCount;
    }
  }
  return counts;
}

export function buildUsageSummary(
  shards: Array<Record<string, unknown>>,
  days = 35,
  referenceDate = new Date(),
): UsageSummary {
  const keys = dateKeys(days, referenceDate);
  const recordsByDate = new Map(
    keys.map((date) => [
      date,
      { date, activeUsers: 0, eventCounts: {} as UsageDailyRecord['eventCounts'] },
    ]),
  );

  for (const shard of shards) {
    const record = typeof shard.date === 'string' ? recordsByDate.get(shard.date) : undefined;
    if (!record) {
      continue;
    }
    record.activeUsers += typeof shard.activeUsers === 'number' ? shard.activeUsers : 0;
    for (const [event, count] of Object.entries(usageEventCounts(shard)) as Array<
      [UsageEventName, number]
    >) {
      record.eventCounts[event] = (record.eventCounts[event] ?? 0) + count;
    }
  }

  const records = [...recordsByDate.values()];

  const totals: UsageSummary['totals'] = { activeUsers: 0, eventCounts: {} };
  for (const record of records) {
    totals.activeUsers += record.activeUsers;
    for (const [event, count] of Object.entries(record.eventCounts) as Array<
      [UsageEventName, number]
    >) {
      totals.eventCounts[event] = (totals.eventCounts[event] ?? 0) + count;
    }
  }

  return { days: records, totals };
}

export async function getUsageSummary(days = 35): Promise<UsageSummary> {
  const keys = dateKeys(days);
  if (keys.length === 0) {
    return buildUsageSummary([], days);
  }
  const snapshot = await getAdminFirestore()
    .collection(DAILY_COLLECTION)
    .where('date', '>=', keys[0])
    .orderBy('date', 'asc')
    .get();

  return buildUsageSummary(snapshot.docs.map((document) => document.data()), days);
}
