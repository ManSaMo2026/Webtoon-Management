export type FontSizePreference = "small" | "medium" | "large";

const STORAGE_KEY = "mansamo_font_size";
const DEFAULT_FONT_SIZE: FontSizePreference = "medium";

export const FONT_SIZE_OPTIONS: ReadonlyArray<{ value: FontSizePreference; label: string }> = [
  { value: "small", label: "작게" },
  { value: "medium", label: "보통" },
  { value: "large", label: "크게" },
];

function isFontSizePreference(value: unknown): value is FontSizePreference {
  return value === "small" || value === "medium" || value === "large";
}

export function getFontSizePreference(): FontSizePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isFontSizePreference(stored) ? stored : DEFAULT_FONT_SIZE;
  } catch {
    return DEFAULT_FONT_SIZE;
  }
}

export function applyFontSizePreference(value: FontSizePreference) {
  document.documentElement.dataset.fontSize = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // The setting still applies for this page when storage is unavailable.
  }
}

export function initializeFontSizePreference() {
  applyFontSizePreference(getFontSizePreference());
}
