import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';

export function WelcomeStep() {
  return (
    <div className="flex flex-col gap-4 text-center">
      <h2 className={typography.csCardTitle}>{copy('onboarding.welcome.title')}</h2>
      <p className={typography.csCaption}>{copy('onboarding.welcome.tagline')}</p>
      <p className={typography.csCaption}>{copy('onboarding.welcome.cloudNote')}</p>
    </div>
  );
}
