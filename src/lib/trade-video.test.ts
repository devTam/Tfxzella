import { describe, expect, it } from "vitest";
import { tradeVideoUrl } from "./trade-video";

describe("trade video links", () => {
  it("allows an empty field to omit or remove a video", () => {
    expect(tradeVideoUrl("  ")).toBeNull();
  });
  it("preserves video paths and timestamps", () => {
    expect(tradeVideoUrl(" https://www.youtube.com/watch?v=example&t=30s ")).toBe("https://www.youtube.com/watch?v=example&t=30s");
    expect(tradeVideoUrl("http://example.com/video")).toBe("http://example.com/video");
  });
  it.each(["javascript:alert(1)", "data:text/html,test", "file:///recording.mp4", "not a URL", "https://user:password@example.com/video", "https://example.com/"+"x".repeat(2048)])("rejects unsafe or invalid links", value => {
    expect(() => tradeVideoUrl(value)).toThrow("valid http:// or https://");
  });
});
