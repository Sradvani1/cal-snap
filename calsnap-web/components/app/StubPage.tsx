import { SectionCard } from '@/components/design/SectionCard';
import { typography } from '@/lib/design/typography';
import { copy } from '@/lib/copy';

interface StubPageProps {
  title: string;
  comingIn: string;
}

export function StubPage({ title, comingIn }: StubPageProps) {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold text-cs-foreground">{title}</h1>
      <SectionCard>
        <p className={typography.csCaption}>
          {copy('common.stub.comingIn', { comingIn })}
        </p>
      </SectionCard>
    </div>
  );
}
