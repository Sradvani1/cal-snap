import { CalorieRingView, CalorieRingViewSkeleton, type RingSegment } from '@/components/design/CalorieRingView';
import { SectionCard } from '@/components/design/SectionCard';

interface CalorieRingCardProps {
  segments: RingSegment[];
  target: number;
  consumed?: number;
}

export function CalorieRingCard({
  segments,
  target,
  consumed,
}: CalorieRingCardProps) {
  return (
    <SectionCard>
      <CalorieRingView
        segments={segments}
        target={target}
        consumed={consumed}
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
