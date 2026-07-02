---
name: WO02 PWA Launch Install
overview: "WO02 complete: maskable icon + 4 iOS splashes, manifest/layout polish, install banner fade, manifest unit test. Spec: docs/implementation/web/PR-WO02.md."
todos:
  - id: prereq-gate
    content: "WO01 on main (4ea0500); run full merge gate; record baseline in PR-WO02 §2"
    status: completed
  - id: asset-script
    content: Add scripts/generate-pwa-assets.mjs + sharp devDep + pnpm generate:pwa-assets
    status: completed
  - id: commit-assets
    content: Run script; commit icon-maskable-512.png + 4 splash PNGs
    status: completed
  - id: manifest-polish
    content: Third manifest icon (maskable 512); orientation portrait; verify colors
    status: completed
  - id: layout-splash
    content: PwaStartupImages in explicit root layout head — 4 startup link tags
    status: completed
  - id: standalone-audit
    content: Audit-only install-storage; fix only if device QA P1
    status: completed
  - id: banner-polish
    content: InstallPromptBanner opacity fade; skip when useReducedMotion
    status: completed
  - id: manifest-unit-test
    content: tests/unit/manifest-pwa.test.ts — manifest JSON + 5 PNG existsSync
    status: completed
  - id: docs-wo02-findings
    content: Fill PR-WO02 §2 gate counts + §3 findings Status after implementation
    status: completed
  - id: final-gate
    content: Full merge gate green; §8 manual rows remain Pending for operator
    status: completed
isProject: false
---

# WO02 — PWA Launch & Install Polish

**Status:** Complete — see [PR-WO02.md](../../docs/implementation/web/PR-WO02.md).

**Spec:** [docs/implementation/web/PR-WO02.md](../../docs/implementation/web/PR-WO02.md)

**Depends on:** WO01 merged to `main` (`4ea0500`).

**Downstream:** WO03 (tab blur + sheet polish) depends on WO02 splash/meta complete.
