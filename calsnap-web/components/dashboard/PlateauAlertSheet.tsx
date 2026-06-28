interface PlateauAlertSheetProps {
  open: boolean;
  onDietBreak: () => void;
  onSmallReduction: () => void;
  onDismiss: () => void;
}

export function PlateauAlertSheet({
  open,
  onDietBreak,
  onSmallReduction,
  onDismiss,
}: PlateauAlertSheetProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plateau-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 id="plateau-title" className="text-lg font-semibold text-neutral-900">
          Plateau Detected
        </h2>
        <p className="mt-3 text-sm text-neutral-600">
          Your weight has been stable for about three weeks. This can happen during a deficit.
        </p>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={onDietBreak}
            className="w-full rounded-xl bg-neutral-100 p-4 text-left transition hover:bg-neutral-200"
          >
            <span className="block font-semibold text-neutral-900">Diet Break</span>
            <span className="mt-1 block text-xs text-neutral-500">
              Eat at maintenance for 2 weeks to reset adaptation
            </span>
          </button>

          <button
            type="button"
            onClick={onSmallReduction}
            className="w-full rounded-xl bg-neutral-100 p-4 text-left transition hover:bg-neutral-200"
          >
            <span className="block font-semibold text-neutral-900">Small Reduction</span>
            <span className="mt-1 block text-xs text-neutral-500">
              Reduce daily target by 60 kcal
            </span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="w-full rounded-lg py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Remind Me Later
          </button>
        </div>
      </div>
    </div>
  );
}
