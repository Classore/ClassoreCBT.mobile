/**
 * Regex matching common blank placeholders in exams:
 * e.g. [blank_1], [blank_2], [blank], {blank_1}, (blank_1), [1], and consecutive underscores (___)
 */
export const BLANK_REGEX = /(\[blank(?:_[a-zA-Z0-9_]+)?\]|\{blank(?:_[a-zA-Z0-9_]+)?\}|\(blank(?:_[a-zA-Z0-9_]+)?\)|\[\d+\]|___+)/gi;

/**
 * Checks if a string contains any blank placeholders.
 */
export const hasBlanks = (text?: string | null): boolean => {
  if (!text) return false;
  return new RegExp(BLANK_REGEX.source, 'i').test(text);
};

/**
 * Extracts a normalized key and human-friendly label from a blank placeholder token.
 * E.g.:
 * "[blank_1]" -> { key: "blank_1", label: "1" }
 * "[1]" -> { key: "blank_1", label: "1" }
 * "{blank_2}" -> { key: "blank_2", label: "2" }
 * "____" -> { key: "blank_1", label: "1" }
 */
export const normalizeBlankToken = (token: string, defaultIndex: number = 1): { key: string; label: string } => {
  const cleaned = token.replace(/^[\[\{\(]+|[\]\}\)]+$/g, '').trim().toLowerCase();
  if (cleaned.startsWith('blank_')) {
    const numPart = cleaned.replace('blank_', '');
    return { key: cleaned, label: numPart || String(defaultIndex) };
  }
  if (cleaned === 'blank') {
    return { key: `blank_${defaultIndex}`, label: String(defaultIndex) };
  }
  if (/^\d+$/.test(cleaned)) {
    return { key: `blank_${cleaned}`, label: cleaned };
  }
  return { key: `blank_${defaultIndex}`, label: String(defaultIndex) };
};

/**
 * Utility to format question text and prompts containing placeholder tags.
 * Transforms placeholders such as "[blank_1]", "[blank_2]", "[blank]", "{blank_1}", or "(blank)"
 * into a series of underscores: "_______".
 */
export const formatQuestionText = (text?: string | null): string => {
  if (!text) return '';
  return text.replace(new RegExp(BLANK_REGEX.source, 'gi'), '_______');
};

