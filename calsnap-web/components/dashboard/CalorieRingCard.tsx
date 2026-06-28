import type { CalorieProgressBand } from '@/lib/dashboard/calorie-progress';
import { CalorieRingView, CalorieRingViewSkeleton } from '@/components/design/CalorieRingView';
import { SectionCard } from '@/components/design/SectionCard';

interface CalorieRingCardProps {
  consumed: number;
  target: number;
  remaining: number;
  progress: number;
  band: CalorieProgressBand;
}

export function CalorieRingCard({
  consumed,
  target,
  remaining,
  progress,
  band,
}: CalorieRingCardProps) {
  return (
    <SectionCard>
      <CalorieRingView
        consumed={consumed}
        target={target}
        remaining={remaining}
        progress={progress}
        band={band}
      />
    </SectionCard>
  );
}

export function CalorieRingCardSkeleton() {
  return (
    <SectionCard>
      <CalorieRingViewSkeleton />
    </SectionCard>
  );
}
