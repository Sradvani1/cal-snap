import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'calsnap-web';

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase-admin'],
  async rewrites() {
    // Safari 16.1+ blocks cross-origin storage for the default firebaseapp.com auth
    // helper. Proxy /__/auth/* so authDomain can match this deployment host.
    // https://firebase.google.com/docs/auth/web/redirect-best-practices
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://${firebaseProjectId}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

export default withSerwist(nextConfig);
