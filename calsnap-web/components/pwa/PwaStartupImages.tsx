const IPHONE14_PORTRAIT =
  '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)';

const IPHONE14_PRO_MAX_PORTRAIT =
  '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)';

/** iOS cold-start splash images — manual link tags for Safari compatibility. */
export function PwaStartupImages() {
  return (
    <>
      <link
        rel="apple-touch-startup-image"
        href="/splash-iphone14-light.png"
        media={IPHONE14_PORTRAIT}
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-iphone14-dark.png"
        media={`${IPHONE14_PORTRAIT} and (prefers-color-scheme: dark)`}
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-iphone14promax-light.png"
        media={IPHONE14_PRO_MAX_PORTRAIT}
      />
      <link
        rel="apple-touch-startup-image"
        href="/splash-iphone14promax-dark.png"
        media={`${IPHONE14_PRO_MAX_PORTRAIT} and (prefers-color-scheme: dark)`}
      />
    </>
  );
}
