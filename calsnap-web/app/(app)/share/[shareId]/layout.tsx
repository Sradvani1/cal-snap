import type { Metadata } from 'next';
import { copy } from '@/lib/copy';
import { readSharedMealPreview } from '@/lib/shares/read-shared-meal-preview';
import { sharedMealSummary } from '@/lib/shares/shared-meal-summary';

interface SharedMealLayoutProps {
  children: React.ReactNode;
  params: Promise<{ shareId: string }>;
}

function configuredAppOrigin(): string | undefined {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  return vercelHost ? `https://${vercelHost.replace(/\/$/, '')}` : undefined;
}

export async function generateMetadata({ params }: SharedMealLayoutProps): Promise<Metadata> {
  const { shareId } = await params;
  const preview = await readSharedMealPreview(shareId);
  if (!preview) {
    return { title: copy('mealLog.share.title') };
  }

  const { title, description } = sharedMealSummary(preview.meal);
  const appUrl = configuredAppOrigin();
  const images =
    preview.photoStoragePath && appUrl ? [`${appUrl}/api/share/${shareId}/photo`] : undefined;

  return {
    title,
    description,
    openGraph: { title, description, images },
  };
}

export default function SharedMealLayout({ children }: SharedMealLayoutProps) {
  return children;
}
