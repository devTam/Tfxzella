export const STANDARD_MISTAKES = ["FOMO", "Revenge trade", "Overtrading", "Moved stop", "Early exit", "Late entry", "Oversized"];

export function normalizeMistakes(selected: string[], otherMistake: string) {
  return [...new Set([...selected, otherMistake].map((mistake) => mistake.trim()).filter((mistake) => mistake && mistake !== "Other"))];
}
