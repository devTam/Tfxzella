import { beforeEach, describe, expect, it, vi } from "vitest";
import { SubmitButton } from "./confirm-submit-button";
import { toast } from "sonner";
import { clearPendingAction } from "./interaction-feedback";

const state = vi.hoisted(() => ({
  pending: true,
  refs: [] as { current: unknown }[],
  cursor: 0,
  cleanups: [] as (() => void)[],
}));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: () => [true, vi.fn()],
  useRef: (value: unknown) => state.refs[state.cursor++] ?? (state.refs[state.cursor - 1] = { current: value }),
  useEffect: (effect: () => void | (() => void)) => { const cleanup=effect(); if(cleanup)state.cleanups.push(cleanup); },
}));
vi.mock("react-dom", () => ({ useFormStatus: () => ({ pending: state.pending }) }));
vi.mock("sonner", () => ({ toast: { loading: vi.fn(() => "saving"), dismiss: vi.fn(), success: vi.fn() } }));
vi.mock("./interaction-feedback", () => ({ beginPendingAction: vi.fn(), clearPendingAction: vi.fn() }));

beforeEach(() => { vi.clearAllMocks(); state.refs = []; state.cursor = 0; state.pending = true; state.cleanups = []; });

describe("submission feedback", () => {
  it("dismisses each loading alert when deletion removes its button before pending ends", () => {
    vi.mocked(toast.loading).mockReturnValueOnce("delete-1").mockReturnValueOnce("delete-2");
    for(const id of ["delete-1", "delete-2"]){
      state.refs=[];state.cursor=0;
      SubmitButton({ children: "Delete trade", pendingLabel: "Deleting trade…" });
      const cleanup=state.cleanups.pop();
      expect(cleanup).toBeTypeOf("function");
      cleanup?.();
      expect(toast.dismiss).toHaveBeenLastCalledWith(id);
    }
    expect(toast.dismiss).toHaveBeenCalledTimes(2);
    expect(toast.success).not.toHaveBeenCalled();
  });
  it("does not report a successful save merely because a failed action stopped pending", () => {
    SubmitButton({ children: "Save trade", successMessage: "Trade saved" });
    expect(toast.loading).toHaveBeenCalled();
    state.pending = false;
    state.cursor = 0;
    SubmitButton({ children: "Save trade", successMessage: "Trade saved" });
    expect(toast.dismiss).toHaveBeenCalledWith("saving");
    expect(clearPendingAction).toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
