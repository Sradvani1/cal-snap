export function mealAnalysisJsonSchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            estimated_weight_g: { type: 'number' },
            protein_g: { type: 'number' },
            carbs_g: { type: 'number' },
            fat_g: { type: 'number' },
            saturated_fat_g: { type: 'number' },
            unsaturated_fat_g: { type: 'number' },
            fiber_g: { type: 'number' },
            confidence: { type: 'number' },
          },
          required: [
            'name',
            'estimated_weight_g',
            'protein_g',
            'carbs_g',
            'fat_g',
            'saturated_fat_g',
            'unsaturated_fat_g',
            'fiber_g',
            'confidence',
          ],
        },
      },
      flagged_items: {
        type: 'array',
        items: { type: 'string' },
      },
      estimation_notes: { type: 'string' },
    },
    required: ['items', 'flagged_items', 'estimation_notes'],
  };
}
