import { CalorieRingView, CalorieRingViewSkeleton, type RingSegment } from '@/components/design/CalorieRingView';
import { SectionCard } from '@/components/design/SectionCard';

interface CalorieRingCardProps {
  segments: RingSegment[];
  target: number;
}

export function CalorieRingCard({
  segments,
  target,
}: CalorieRingCardProps) {
  return (
    <SectionCard>
      <CalorieRingView
        segments={segments}
        target={target}
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
