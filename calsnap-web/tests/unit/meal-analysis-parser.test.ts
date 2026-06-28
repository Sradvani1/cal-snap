import { describe, expect, it } from 'vitest';
import {
  extractJSONObject,
  isValidJSONObject,
  normalizedJSONData,
} from '@/lib/gemini/meal-analysis-parser';
import { parseMealAnalysisResponse } from '@/lib/gemini/meal-analysis-zod';

const EMPTY_PAYLOAD = {
  items: [],
  meal_total: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
  flagged_items: [],
  estimation_notes: 'ok',
};

function decodeResponse(json: string) {
  const data = normalizedJSONData(json);
  expect(data).not.toBeNull();
  return parseMealAnalysisResponse(data);
}

describe('meal-analysis-parser', () => {
  it('strips markdown fence', () => {
    const wrapped = `\`\`\`json
${JSON.stringify(EMPTY_PAYLOAD)}
\`\`\``;
    const json = extractJSONObject(wrapped);
    const decoded = parseMealAnalysisResponse(JSON.parse(json));
    expect(decoded.estimationNotes).toBe('ok');
  });

  it('extracts JSON from preamble text', () => {
    const wrapped = `Here is the meal analysis:
${JSON.stringify(EMPTY_PAYLOAD)}`;
    const json = extractJSONObject(wrapped);
    const decoded = parseMealAnalysisResponse(JSON.parse(json));
    expect(decoded.estimationNotes).toBe('ok');
  });

  it('handles double-encoded string', () => {
    const inner = JSON.stringify(EMPTY_PAYLOAD);
    const wrapped = JSON.stringify(inner);
    const decoded = decodeResponse(wrapped);
    expect(decoded.estimationNotes).toBe('ok');
  });

  it('handles brace inside string value', () => {
    const wrapped = JSON.stringify({
      items: [
        {
          name: 'curly } brace',
          estimated_weight_g: 1,
          calories: 1,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
          fiber_g: 0,
          confidence: 0.9,
        },
      ],
      meal_total: { calories: 1, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 },
      flagged_items: [],
      estimation_notes: 'ok',
    });
    const decoded = decodeResponse(wrapped);
    expect(decoded.items[0]?.name).toBe('curly } brace');
  });

  it('rejects plain text as invalid JSON object', () => {
    expect(isValidJSONObject('Not JSON at all')).toBe(false);
  });
});
