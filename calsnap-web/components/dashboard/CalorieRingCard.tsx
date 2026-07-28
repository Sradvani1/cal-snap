import { CalorieRingView, CalorieRingViewSkeleton, type RingSegment } from '@/components/design/CalorieRingView';
import { SectionCard } from '@/components/design/SectionCard';

interface CalorieRingCardProps {
  segments: RingSegment[];
  target: number;
  consumed?: number;
  onClick?: () => void;
}

export function CalorieRingCard({
  segments,
  target,
  consumed,
  onClick,
}: CalorieRingCardProps) {
  return (
    <SectionCard>
      <CalorieRingView
        segments={segments}
        target={target}
        consumed={consumed}
        onClick={onClick}
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
