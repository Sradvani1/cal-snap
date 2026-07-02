/**
 * Generates PWA maskable icon + iOS startup splash PNGs from apple-touch-icon.png.
 *
 * Usage (from calsnap-web/):
 *   pnpm generate:pwa-assets
 *
 * Does NOT regenerate icon-192.png / icon-512.png — those stay as committed any-purpose icons.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const sourceIcon = join(publicDir, 'apple-touch-icon.png');

// Must match lib/design/colors.ts
const LIGHT_BACKGROUND = '#F2F2F7';
const DARK_BACKGROUND = '#000000';
const PRIMARY = '#3DA35D';

const MASKABLE_SIZE = 512;
const MASKABLE_ICON_SIZE = Math.round(MASKABLE_SIZE * 0.8);

const SPLASH_TARGETS = [
  {
    width: 1170,
    height: 2532,
    light: 'splash-iphone14-light.png',
    dark: 'splash-iphone14-dark.png',
  },
  {
    width: 1284,
    height: 2778,
    light: 'splash-iphone14promax-light.png',
    dark: 'splash-iphone14promax-dark.png',
  },
];

async function loadCenteredIcon(targetSize) {
  return sharp(sourceIcon)
    .resize(targetSize, targetSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function writeComposite(outputPath, width, height, background, iconBuffer) {
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background,
    },
  })
    .composite([{ input: iconBuffer, gravity: 'center' }])
    .png()
    .toFile(outputPath);
}

async function generateMaskableIcon() {
  const iconBuffer = await loadCenteredIcon(MASKABLE_ICON_SIZE);
  await writeComposite(
    join(publicDir, 'icon-maskable-512.png'),
    MASKABLE_SIZE,
    MASKABLE_SIZE,
    PRIMARY,
    iconBuffer,
  );
  console.log('Wrote icon-maskable-512.png');
}

async function generateSplashPair({ width, height, light, dark }) {
  const iconSize = Math.round(Math.min(width, height) * 0.2);
  const iconBuffer = await loadCenteredIcon(iconSize);

  await writeComposite(join(publicDir, light), width, height, LIGHT_BACKGROUND, iconBuffer);
  console.log(`Wrote ${light}`);

  await writeComposite(join(publicDir, dark), width, height, DARK_BACKGROUND, iconBuffer);
  console.log(`Wrote ${dark}`);
}

async function main() {
  if (!existsSync(sourceIcon)) {
    console.error(`Missing source icon: ${sourceIcon}`);
    process.exit(1);
  }

  await generateMaskableIcon();
  for (const target of SPLASH_TARGETS) {
    await generateSplashPair(target);
  }
  console.log('PWA assets generated.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
