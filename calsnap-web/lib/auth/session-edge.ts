import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

const SESSION_COOKIE_NAME = '__session';

export { SESSION_COOKIE_NAME };

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
);

function getProjectId(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-calsnap';
}

export async function verifySessionToken(
  token: string,
): Promise<JWTPayload | null> {
  const projectId = getProjectId();
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

  try {
    if (useEmulator) {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf8'),
      ) as JWTPayload;
      if (payload.aud !== projectId || payload.iss !== `https://securetoken.google.com/${projectId}`) {
        return null;
      }
      const now = Math.floor(Date.now() / 1000);
      if (typeof payload.exp === 'number' && payload.exp < now) {
        return null;
      }
      return payload;
    }

    const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return payload;
  } catch {
    return null;
  }
}

export async function verifySessionCookieValue(
  sessionCookie: string,
): Promise<JWTPayload | null> {
  return verifySessionToken(sessionCookie);
}
