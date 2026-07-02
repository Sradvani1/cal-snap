import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { lightColors } from '@/lib/design/colors';

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose: string;
}

interface WebManifest {
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: string;
  orientation: string;
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
}

const publicDir = resolve(process.cwd(), 'public');
const manifestPath = resolve(publicDir, 'manifest.webmanifest');

const requiredSplashAssets = [
  'icon-maskable-512.png',
  'splash-iphone14-light.png',
  'splash-iphone14-dark.png',
  'splash-iphone14promax-light.png',
  'splash-iphone14promax-dark.png',
] as const;

function readManifest(): WebManifest {
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as WebManifest;
}

describe('PWA manifest and assets', () => {
  it('declares required manifest fields and icon purposes', () => {
    const manifest = readManifest();

    expect(manifest.name).toBe('CalSnap');
    expect(manifest.short_name).toBe('CalSnap');
    expect(manifest.start_url).toBe('/dashboard');
    expect(manifest.display).toBe('standalone');
    expect(manifest.scope).toBe('/');

    const anyIcons = manifest.icons.filter((icon) => icon.purpose === 'any');
    const maskableIcons = manifest.icons.filter((icon) => icon.purpose === 'maskable');

    expect(anyIcons).toHaveLength(2);
    expect(anyIcons.map((icon) => icon.src).sort()).toEqual(['/icon-192.png', '/icon-512.png']);

    expect(manifest.icons).toHaveLength(3);

    expect(maskableIcons).toHaveLength(1);
    expect(maskableIcons[0]).toMatchObject({
      src: '/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    });

    expect(manifest.orientation).toBe('portrait');
    expect(manifest.background_color).toBe(lightColors.background);
    expect(manifest.theme_color).toBe(lightColors.primary);
  });

  it('commits maskable icon and iOS startup splash PNGs', () => {
    for (const filename of requiredSplashAssets) {
      expect(existsSync(resolve(publicDir, filename))).toBe(true);
    }
  });
});
