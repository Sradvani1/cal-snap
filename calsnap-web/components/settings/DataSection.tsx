'use client';

import { SettingsSectionCard } from '@/components/settings/SettingsSectionCard';

interface DataSectionProps {
  onExport: () => void;
  onDelete: () => void;
  isExporting: boolean;
}

export function DataSection({ onExport, onDelete, isExporting }: DataSectionProps) {
  return (
    <SettingsSectionCard title="Your data">
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          {isExporting ? 'Exporting…' : 'Export data (CSV)'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-100"
        >
          Delete all my data
        </button>
      </div>
    </SettingsSectionCard>
  );
}
