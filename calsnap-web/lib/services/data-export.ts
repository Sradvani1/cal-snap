import type { MealEntry } from '@/lib/models/meal-entry';
import type { WeighIn } from '@/lib/models/weigh-in';

const MEALS_HEADER =
  'id,userId,timestamp,mealType,calories,proteinG,carbsG,fatG,fiberG,confidence,isManuallyAdjusted,description';
const WEIGH_INS_HEADER =
  'id,userId,date,weightKg,tdee,target,bmi,source';

function escapeCSV(value: string): string {
  if (!value.includes(',') && !value.includes('"') && !value.includes('\n')) {
    return value;
  }
  return `"${value.replace(/"/g, '""')}"`;
}

function iso8601(date: Date): string {
  return date.toISOString();
}

function formatDouble(value: number): string {
  return Number(value.toFixed(2)).toString();
}

export function makeCSV(meals: MealEntry[], weighIns: WeighIn[]): string {
  const lines: string[] = ['# meals', MEALS_HEADER];

  const sortedMeals = [...meals].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );
  for (const meal of sortedMeals) {
    const description = meal.textDescription ?? '';
    lines.push(
      [
        meal.id,
        meal.userId,
        iso8601(meal.timestamp),
        meal.mealType,
        String(meal.totalCalories),
        formatDouble(meal.totalProteinG),
        formatDouble(meal.totalCarbsG),
        formatDouble(meal.totalFatG),
        formatDouble(meal.totalFiberG),
        formatDouble(meal.geminiConfidence),
        meal.isManuallyAdjusted ? 'true' : 'false',
        escapeCSV(description),
      ].join(','),
    );
  }

  lines.push('# weigh_ins');
  lines.push(WEIGH_INS_HEADER);

  const sortedWeighIns = [...weighIns].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
  for (const weighIn of sortedWeighIns) {
    const source = weighIn.source ?? '';
    lines.push(
      [
        weighIn.id,
        weighIn.userId,
        iso8601(weighIn.date),
        formatDouble(weighIn.weightKg),
        String(weighIn.calculatedTDEE ?? ''),
        String(weighIn.adjustedDailyTarget ?? ''),
        formatDouble(weighIn.bmi ?? 0),
        source,
      ].join(','),
    );
  }

  return lines.join('\n');
}

export function exportFilename(displayName: string): string {
  const slug =
    displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'export';
  return `calsnap-${slug}-export.csv`;
}

export function triggerCSVDownload(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
