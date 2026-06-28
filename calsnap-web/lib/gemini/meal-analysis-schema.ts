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
            calories: { type: 'integer' },
            protein_g: { type: 'number' },
            carbs_g: { type: 'number' },
            fat_g: { type: 'number' },
            fiber_g: { type: 'number' },
            confidence: { type: 'number' },
          },
          required: [
            'name',
            'estimated_weight_g',
            'calories',
            'protein_g',
            'carbs_g',
            'fat_g',
            'fiber_g',
            'confidence',
          ],
        },
      },
      meal_total: {
        type: 'object',
        properties: {
          calories: { type: 'integer' },
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
          fiber_g: { type: 'number' },
        },
        required: ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'],
      },
      flagged_items: {
        type: 'array',
        items: { type: 'string' },
      },
      estimation_notes: { type: 'string' },
    },
    required: ['items', 'meal_total', 'flagged_items', 'estimation_notes'],
  };
}
