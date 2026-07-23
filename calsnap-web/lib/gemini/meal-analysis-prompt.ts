export const MEAL_ANALYSIS_SYSTEM_INSTRUCTION = `For each food item, estimate:
- The item name (specific, e.g. "grilled chicken breast" not just "chicken")
- Weight in grams
- Protein in grams
- Carbohydrates in grams
- Fat in grams (total of saturated + unsaturated)
- Saturated fat in grams (the solid fat at room temperature)
- Unsaturated fat in grams (the liquid oils, including mono- and poly-unsaturated fats)
- Fiber in grams
- Confidence score 0.0–1.0

Use standard USDA nutritional values as your reference database.

Flag any item with confidence below 0.6 in the flaggedItems array.
Include brief estimation_notes explaining your reasoning for portion sizes.`;

interface PromptOptions {
  hasImage: boolean;
  description?: string;
}

export function buildMealAnalysisPrompt(options: PromptOptions): string {
  const { hasImage, description } = options;
  const hasDescription = Boolean(description && description.length > 0);

  if (!hasImage && !hasDescription) {
    throw new Error('Meal analysis requires an image or description');
  }

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

For each food item you can identify, use plate size, utensils, and visual proportion as references for portions.

Be honest with confidence scores; reduce confidence for partially visible items, unclear sauces/dressings, or ambiguous portions.`;
}

function imageWithDescriptionPrompt(description: string): string {
  return `${imageOnlyPrompt()}

Additional context from user: ${description}
Use this to refine your estimates (e.g. "user says this is 200g of grilled chicken").`;
}

function descriptionOnlyPrompt(description: string): string {
  return `Estimate the nutritional breakdown for this meal based on the user's text description.

User description: ${description}

Use standard serving sizes as reference for portions.

Be honest with confidence scores; use lower confidence when portions are ambiguous or the description is vague. When the description is vague (e.g. "some rice"), use typical serving sizes but flag the item.`;
}
