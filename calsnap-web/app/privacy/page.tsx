import Link from 'next/link';
import { copy } from '@/lib/copy';
import { PRIVACY_GITHUB_ISSUES_URL } from '@/lib/copy/privacy';
import { typography } from '@/lib/design/typography';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className={`${typography.csCardTitle} text-3xl`}>{copy('privacy.title')}</h1>
      <p className={`${typography.csCaption} mt-2`}>{copy('privacy.lastUpdated')}</p>

      <div className={`${typography.csBody} mt-8 flex flex-col gap-8 leading-relaxed`}>
        <p>{copy('privacy.intro')}</p>

        <section>
          <h2 className={typography.csCardTitle}>{copy('privacy.section.collected.title')}</h2>
          <p className="mt-2">{copy('privacy.section.collected.body')}</p>
        </section>

        <section>
          <h2 className={typography.csCardTitle}>{copy('privacy.section.ai.title')}</h2>
          <p className="mt-2">{copy('privacy.section.ai.body')}</p>
        </section>

        <section>
          <h2 className={typography.csCardTitle}>{copy('privacy.section.storage.title')}</h2>
          <p className="mt-2">{copy('privacy.section.storage.body')}</p>
        </section>

        <section>
          <h2 className={typography.csCardTitle}>{copy('privacy.section.notCollected.title')}</h2>
          <p className="mt-2">{copy('privacy.section.notCollected.body')}</p>
        </section>

        <section>
          <h2 className={typography.csCardTitle}>{copy('privacy.section.deletion.title')}</h2>
          <p className="mt-2">{copy('privacy.section.deletion.body')}</p>
        </section>

        <section>
          <h2 className={typography.csCardTitle}>{copy('privacy.section.contact.title')}</h2>
          <p className="mt-2">
            {copy('privacy.section.contact.body')}{' '}
            <a
              href={PRIVACY_GITHUB_ISSUES_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-cs-foreground underline"
            >
              {copy('privacy.section.contact.linkLabel')}
            </a>
            .
          </p>
        </section>
      </div>

      <p className="mt-10">
        <Link href="/" className="font-medium text-cs-foreground underline">
          {copy('privacy.backHome')}
        </Link>
      </p>
    </div>
  );
}
