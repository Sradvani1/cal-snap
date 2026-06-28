interface EstimationNotesAccordionProps {
  notes: string | null;
}

export function EstimationNotesAccordion({ notes }: EstimationNotesAccordionProps) {
  if (!notes) {
    return null;
  }

  return (
    <details className="rounded-lg border border-neutral-200 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-neutral-700">
        Estimation notes
      </summary>
      <p className="border-t border-neutral-100 px-4 py-3 text-sm text-neutral-600">{notes}</p>
    </details>
  );
}
