function stripMarkdownFence(text: string): string {
  let result = text;
  if (result.startsWith('```')) {
    result = result.slice(3);
    const newlineIndex = result.indexOf('\n');
    if (newlineIndex !== -1) {
      result = result.slice(newlineIndex + 1);
    }
  }
  if (result.endsWith('```')) {
    result = result.slice(0, -3);
  }
  return result.trim();
}

function extractBalancedJSONObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = start; i < text.length; i++) {
    const character = text[i];
    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (character === '\\') {
        isEscaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    switch (character) {
      case '"':
        inString = true;
        break;
      case '{':
        depth += 1;
        break;
      case '}':
        depth -= 1;
        if (depth === 0) {
          return text.slice(start, i + 1);
        }
        break;
      default:
        break;
    }
  }

  return null;
}

function jsonCandidates(text: string): string[] {
  let trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    trimmed = stripMarkdownFence(trimmed);
  }

  const candidates: string[] = [];

  if (trimmed.startsWith('"')) {
    try {
      const inner = JSON.parse(trimmed) as string;
      if (typeof inner === 'string') {
        candidates.push(...jsonCandidates(inner));
      }
    } catch {
      // ignore invalid double-encoded string
    }
  }

  const balanced = extractBalancedJSONObject(trimmed);
  if (balanced) {
    candidates.push(balanced);
  }

  candidates.push(trimmed);

  if (!trimmed.startsWith('{')) {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      candidates.push(trimmed.slice(start, end + 1));
    }
  }

  const seen = new Set<string>();
  return candidates
    .map((candidate) => candidate.trim())
    .filter((candidate) => candidate.length > 0)
    .filter((candidate) => {
      if (seen.has(candidate)) {
        return false;
      }
      seen.add(candidate);
      return true;
    });
}

export function isValidJSONObject(data: string): boolean {
  try {
    const object = JSON.parse(data) as unknown;
    return typeof object === 'object' && object !== null && !Array.isArray(object);
  } catch {
    return false;
  }
}

export function normalizedJSONData(modelText: string): unknown | null {
  for (const candidate of jsonCandidates(modelText)) {
    if (isValidJSONObject(candidate)) {
      return JSON.parse(candidate) as unknown;
    }
  }

  const candidates = jsonCandidates(modelText);
  const last = candidates[candidates.length - 1];
  if (!last) {
    return null;
  }
  try {
    return JSON.parse(last) as unknown;
  } catch {
    return null;
  }
}

export function extractJSONObject(text: string): string {
  const data = normalizedJSONData(text);
  if (data !== null) {
    return JSON.stringify(data);
  }
  return text.trim();
}

export function decodingErrorDescription(error: unknown): string {
  if (!(error instanceof Error)) {
    return String(error);
  }
  return error.message;
}
