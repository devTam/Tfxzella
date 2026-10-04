import { describe, expect, it } from "vitest";
import { normalizeMistakes } from "./trade-mistakes";

describe("normalizeMistakes", () => {
  it("combines predefined and typed mistakes", () => {
    expect(normalizeMistakes(["FOMO", "Moved stop"], "Ignored higher-timeframe bias")).toEqual(["FOMO", "Moved stop", "Ignored higher-timeframe bias"]);
  });

  it("trims, de-duplicates, and ignores empty or literal Other values", () => {
    expect(normalizeMistakes([" FOMO ", "FOMO", "Other"], "  ")).toEqual(["FOMO"]);
  });
});
