# Internal Usage Analytics

CalSnap records only allowlisted product events in first-party Firestore aggregates. It does not
record meal contents, photos, descriptions, profile fields, weight data, IP addresses, user agents,
advertising identifiers, or raw user IDs.

## Production setup

1. Set a random, server-only `USAGE_ANALYTICS_HASH_SECRET` in Vercel. It must be at least 32 random
   characters and must not use a `NEXT_PUBLIC_` prefix.
2. Enable Firestore TTL for the `expiresAt` field on the `internalUsageDedupe` collection group. The
   TTL removes the daily HMAC-based active-user dedupe records after 35 days (Firestore TTL deletion
   can take up to 24 additional hours). The records also keep a capped total event count to protect
   aggregate metrics from abuse. The daily aggregate documents are retained.

```bash
gcloud firestore fields ttls update expiresAt \
  --collection-group=internalUsageDedupe \
  --enable-ttl \
  --database='(default)'
```

3. Grant the operator account the Firebase custom claim `internalAnalytics: true` with Firebase Admin:

```ts
await getAuth().setCustomUserClaims('<operator-uid>', { internalAnalytics: true });
```

The operator must sign out and sign back in to receive a fresh ID token. To remove access, clear the
claim and call `revokeRefreshTokens('<operator-uid>')`, then require the user to sign in again. Access
the dashboard at `/operator/usage`. The dashboard API enforces the claim server-side; the URL alone
grants no access.

## Retention and deletion

The short-lived daily dedupe documents calculate active users and enforce a per-user daily event cap.
They contain a daily HMAC derived from the account UID and are never returned to the browser. Deleting
a user does not alter already-anonymized daily totals.
