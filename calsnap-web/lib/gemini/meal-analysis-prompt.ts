export function buildMealAnalysisPrompt(description?: string): string {
  let prompt = `Analyze this meal image and return a JSON nutritional breakdown.

For each food item you can identify, estimate:
- The item name (specific, e.g. "grilled chicken breast" not just "chicken")
- Estimated weight in grams (use plate size, utensils, and visual proportion as references)
- Calories
- Protein in grams
- Carbohydrates in grams (excluding fiber)
- Fat in grams
- Fiber in grams
- Confidence score 0.0–1.0 (be honest; reduce confidence for partially visible items,
  unclear sauces/dressings, or ambiguous portions)

Use standard USDA nutritional values as your reference database.
Caloric density: carbs = 4 kcal/g, protein = 4 kcal/g, fat = 9 kcal/g, fiber = 2 kcal/g.

Flag any item with confidence below 0.6 in the flaggedItems array.
Include brief estimation_notes explaining your reasoning for portion sizes.`;

  if (description && description.length > 0) {
    prompt += `\n\nAdditional context from user: ${description}\nUse this to refine your estimates.`;
  }

  return prompt;
}
