'use client';

import packageJson from '@/package.json';
import { SettingsSectionCard } from '@/components/settings/SettingsSectionCard';

export function AboutSection() {
  return (
    <SettingsSectionCard title="About">
      <div className="flex flex-col gap-3 text-sm text-neutral-600">
        <p>
          CalSnap version <span className="font-medium text-neutral-900">{packageJson.version}</span>
        </p>
        <p>
          Calorie targets use formulas aligned with the{' '}
          <a
            href="https://www.niddk.nih.gov/bwp"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-neutral-900 underline"
          >
            NIH Body Weight Planner
          </a>
          .
        </p>
        <p>
          Macro guidance follows the{' '}
          <a
            href="https://www.dietaryguidelines.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-neutral-900 underline"
          >
            Dietary Guidelines for Americans
          </a>
          .
        </p>
      </div>
    </SettingsSectionCard>
  );
}
