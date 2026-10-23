import { describe, expect, it } from "vitest";
import { planImages } from "./plan-images";

function imageForm(key = "tfxzella/users/user-1/chart-1", mime = "image/png", size = "5000") {
  const form = new FormData();
  form.append("attachmentKey", key);
  form.append("attachmentMime", mime);
  form.append("attachmentSize", size);
  return form;
}

describe("daily bias chart validation", () => {
  it("accepts owned uploads and an empty list for removing charts", () => {
    expect(planImages(imageForm(), "user-1")).toEqual([{ objectKey: "tfxzella/users/user-1/chart-1", mimeType: "image/png", size: 5000, userId: "user-1" }]);
    expect(planImages(new FormData(), "user-1")).toEqual([]);
  });
  it("rejects another user's image and paths outside the upload folder", () => {
    expect(() => planImages(imageForm(), "user-2")).toThrow();
    expect(() => planImages(imageForm("tfxzella/users/user-1/../chart"), "user-1")).toThrow();
  });
  it.each([["image/svg+xml", "100"], ["image/png", "5000001"], ["image/png", "0"], ["image/png", "NaN"], ["image/png", "1.5"]])("rejects invalid image metadata %s %s", (mime, size) => {
    expect(() => planImages(imageForm(undefined, mime, size), "user-1")).toThrow();
  });
  it("rejects missing metadata and more than three charts", () => {
    const missing = imageForm();
    missing.delete("attachmentMime");
    expect(() => planImages(missing, "user-1")).toThrow();
    const tooMany = new FormData();
    for (let i = 0; i < 4; i++) for (const [key, value] of imageForm(`tfxzella/users/user-1/chart-${i}`)) tooMany.append(key, value);
    expect(() => planImages(tooMany, "user-1")).toThrow();
  });
});
