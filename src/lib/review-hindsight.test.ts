import { describe, expect, it } from "vitest";
import { buildHindsightTrade } from "./review-hindsight";

describe("buildHindsightTrade", () => {
  const base = { period: "DAILY" as const, symbol: "mnq", direction: "LONG", entryTime: "09:42", rationale: "Retest held", userId: "user-1" };

  it("normalizes an editable daily hindsight trade and keeps its upload", () => {
    const image = { objectKey: "tfxzella/users/user-1/chart", mimeType: "image/png", size: 1200 };
    expect(buildHindsightTrade({ ...base, image })).toEqual({ symbol: "MNQ", direction: "LONG", entryTime: "09:42", rationale: "Retest held", image });
  });

  it("removes the hindsight trade when every edit field and upload is cleared", () => {
    expect(buildHindsightTrade({ ...base, symbol: "", direction: "", entryTime: "", rationale: "" })).toBeNull();
  });

  it("rejects uploads outside the signed-in user's folder", () => {
    expect(() => buildHindsightTrade({ ...base, image: { objectKey: "tfxzella/users/user-2/chart", mimeType: "image/png", size: 1200 } })).toThrow("Invalid hindsight image");
  });
});
