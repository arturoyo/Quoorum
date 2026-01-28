/**
 * Utilities for parsing JSON responses from AI models
 * AI models often return JSON wrapped in markdown code blocks
 */

/**
 * Clean markdown code blocks from AI response
 * Handles: ```json ... ```, ``` ... ```, and raw JSON
 */
export function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();

  // Remove ```json or ``` at the start
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }

  // Remove ``` at the end
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  return cleaned.trim();
}

/**
 * Parse JSON from AI response with automatic cleanup
 * @throws {SyntaxError} if JSON is still invalid after cleanup
 */
export function parseAIJson<T = unknown>(text: string): T {
  const cleaned = cleanJsonResponse(text);
  return JSON.parse(cleaned) as T;
}

/**
 * Safely parse JSON from AI response
 * Returns null if parsing fails instead of throwing
 */
export function safeParseAIJson<T = unknown>(text: string): T | null {
  try {
    return parseAIJson<T>(text);
  } catch {
    return null;
  }
}

/**
 * Parse JSON with a fallback value if parsing fails
 */
export function parseAIJsonWithFallback<T>(text: string, fallback: T): T {
  const result = safeParseAIJson<T>(text);
  return result ?? fallback;
}
