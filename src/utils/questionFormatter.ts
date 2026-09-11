/**
 * Utility to format question text and prompts containing placeholder tags.
 * Transforms placeholders such as "[blank_1]", "[blank_2]", "[blank]", "{blank_1}", or "(blank)"
 * into a series of underscores: "_______".
 */
export const formatQuestionText = (text?: string | null): string => {
  if (!text) return '';
  // Matches [blank_1], [blank_2], [blank], {blank_1}, (blank_1), [1], etc.
  return text.replace(/\[blank(_[a-zA-Z0-9_]+)?\]|\{blank(_[a-zA-Z0-9_]+)?\}|\(blank(_[a-zA-Z0-9_]+)?\)/gi, '_______');
};
