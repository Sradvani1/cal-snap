interface MealScannerAnalyzingViewProps {
  onCancel: () => void;
}

export function MealScannerAnalyzingView({ onCancel }: MealScannerAnalyzingViewProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 py-16 text-center">
      <div
        className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900"
        aria-hidden
      />
      <p className="text-sm font-medium text-neutral-900">Analyzing your meal…</p>
      <p className="mt-1 text-sm text-neutral-500">This usually takes a few seconds</p>
      <button
        type="button"
        onClick={onCancel}
        className="mt-6 min-h-11 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700"
      >
        Cancel
      </button>
    </div>
  );
}
