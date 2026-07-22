interface PromptOptions {
  hasImage: boolean;
  description?: string;
}

export function buildMealAnalysisPrompt(options: PromptOptions): string {
  const { hasImage, description } = options;
  const hasDescription = Boolean(description && description.length > 0);

  if (hasImage && hasDescription) {
    return imageWithDescriptionPrompt(description!);
  }
  if (hasImage) {
    return imageOnlyPrompt();
  }
  return descriptionOnlyPrompt(description!);
}

function imageOnlyPrompt(): string {
  return `Analyze this meal image and return a JSON nutritional breakdown.

For each food item you can identify, estimate:
- The item name (specific, e.g. "grilled chicken breast" not just "chicken")
- Estimated weight in grams (use plate size, utensils, and visual proportion as references)
- Calories
- Protein in grams
- Carbohydrates in grams (excluding fiber)
- Fat in grams (total of saturated + unsaturated)
- Saturated fat in grams (the solid fat at room temperature)
- Unsaturated fat in grams (the liquid oils, including mono- and poly-unsaturated fats)
- Fiber in grams
- Confidence score 0.0–1.0 (be honest; reduce confidence for partially visible items,
  unclear sauces/dressings, or ambiguous portions)

Use standard USDA nutritional values as your reference database.
Caloric density: carbs = 4 kcal/g, protein = 4 kcal/g, fat = 9 kcal/g, fiber = 2 kcal/g.

Flag any item with confidence below 0.6 in the flaggedItems array.
Include brief estimation_notes explaining your reasoning for portion sizes.`;
}

function imageWithDescriptionPrompt(description: string): string {
  return `Analyze this meal image and return a JSON nutritional breakdown.

For each food item you can identify, estimate:
- The item name (specific, e.g. "grilled chicken breast" not just "chicken")
- Estimated weight in grams (use plate size, utensils, and visual proportion as references)
- Calories
- Protein in grams
- Carbohydrates in grams (excluding fiber)
- Fat in grams (total of saturated + unsaturated)
- Saturated fat in grams (the solid fat at room temperature)
- Unsaturated fat in grams (the liquid oils, including mono- and poly-unsaturated fats)
- Fiber in grams
- Confidence score 0.0–1.0 (be honest; reduce confidence for partially visible items,
  unclear sauces/dressings, or ambiguous portions)

Use standard USDA nutritional values as your reference database.
Caloric density: carbs = 4 kcal/g, protein = 4 kcal/g, fat = 9 kcal/g, fiber = 2 kcal/g.

Flag any item with confidence below 0.6 in the flaggedItems array.
Include brief estimation_notes explaining your reasoning for portion sizes.

Additional context from user: ${description}
Use this to refine your estimates (e.g. "user says this is 200g of grilled chicken").`;
}

function descriptionOnlyPrompt(description: string): string {
  return `Estimate the nutritional breakdown for this meal based on the user's text description.

User description: ${description}

For each food item mentioned, estimate:
- The item name (specific, e.g. "grilled chicken breast" not just "chicken")
- Estimated weight in grams (use standard serving sizes as reference)
- Calories
- Protein in grams
- Carbohydrates in grams (excluding fiber)
- Fat in grams (total of saturated + unsaturated)
- Saturated fat in grams (the solid fat at room temperature)
- Unsaturated fat in grams (the liquid oils, including mono- and poly-unsaturated fats)
- Fiber in grams
- Confidence score 0.0–1.0 (be honest; use lower confidence when portions are ambiguous
  or the description is vague)

Use standard USDA nutritional values as your reference database.
Caloric density: carbs = 4 kcal/g, protein = 4 kcal/g, fat = 9 kcal/g, fiber = 2 kcal/g.

Flag any item with confidence below 0.6 in the flaggedItems array.
Include brief estimation_notes explaining your reasoning for portion sizes.
When the description is vague (e.g. "some rice"), use typical serving sizes but flag the item.`;
}
