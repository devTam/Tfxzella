import { afterEach, describe, expect, it, vi } from "vitest";
import { InteractionFeedback } from "./interaction-feedback";

const effects = vi.hoisted(() => [] as (() => void | (() => void))[]);
vi.mock("react", async importOriginal => ({ ...await importOriginal<typeof import("react")>(), useEffect: (effect: () => void | (() => void)) => effects.push(effect) }));
vi.mock("sonner", () => ({ toast: { loading: vi.fn(), success: vi.fn() } }));

afterEach(() => { effects.length = 0; vi.unstubAllGlobals(); });

describe("navigation feedback", () => {
  it("does not permanently mark reused next-trade anchors as pending", () => {
    const document = new EventTarget();
    class Anchor {
      dataset: Record<string, string> = {};
      target = "";
      closest() { return this; }
      querySelector() { return null; }
      hasAttribute() { return false; }
    }
    vi.stubGlobal("document", document);
    vi.stubGlobal("Element", Anchor);
    InteractionFeedback();
    const cleanup = effects[0]();
    const anchor = new Anchor();
    // Next.js may reuse this same element as its href advances through trades.
    for (let navigation = 0; navigation < 3; navigation++) {
      const event = new Event("click");
      Object.defineProperty(event, "target", { value: anchor });
      document.dispatchEvent(event);
      expect(anchor.dataset.pending).toBeUndefined();
    }
    cleanup?.();
  });
});
