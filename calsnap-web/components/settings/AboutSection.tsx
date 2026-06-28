'use client';

import packageJson from '@/package.json';
import { SectionCard } from '@/components/design/SectionCard';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';

export function AboutSection() {
  return (
    <SectionCard title={copy('settings.section.about')}>
      <div className={`${typography.csCaption} flex flex-col gap-3`}>
        <p>{copy('settings.about.version', { version: packageJson.version })}</p>
        <p>
          {copy('settings.about.nih')}{' '}
          <a
            href="https://www.niddk.nih.gov/bwp"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-cs-foreground underline"
          >
            niddk.nih.gov/bwp
          </a>
        </p>
        <p>
          {copy('settings.about.dga')}{' '}
          <a
            href="https://www.dietaryguidelines.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-cs-foreground underline"
          >
            dietaryguidelines.gov
          </a>
        </p>
      </div>
    </SectionCard>
  );
}
