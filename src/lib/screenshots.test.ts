import { describe, expect, it } from "vitest";
import { screenshotFields } from "./screenshots";
import { buildHindsightTrade, hindsightImages } from "./review-hindsight";

function add(form: FormData, key: string, frame = "") {
  form.append("attachmentKey", `tfxzella/users/user-1/${key}`);
  form.append("attachmentMime", "image/png");
  form.append("attachmentSize", "1234");
  form.append("attachmentTimeframe", frame);
}

describe("multiple screenshot groups", () => {
  it("keeps ten images in each timeframe attached to the right group", () => {
    const form = new FormData();
    for (const frame of ["HTF", "MTF", "LTF"]) for (let i = 0; i < 10; i++) add(form, `${frame}-${i}`, frame);
    const images = screenshotFields(form, "user-1", true);
    expect(images).toHaveLength(30);
    for (const frame of ["HTF", "MTF", "LTF"]) expect(images.filter(image => image.timeframe === frame)).toHaveLength(10);
  });
  it("rejects overflow, unknown timeframes, duplicate images and foreign uploads", () => {
    const over = new FormData();
    for (let i = 0; i < 11; i++) add(over, `chart-${i}`, "HTF");
    expect(() => screenshotFields(over, "user-1", true)).toThrow("per timeframe");
    const unknown = new FormData(); add(unknown, "chart", "OTHER");
    expect(() => screenshotFields(unknown, "user-1", true)).toThrow("timeframe");
    const duplicate = new FormData(); add(duplicate, "chart", "HTF"); add(duplicate, "chart", "MTF");
    expect(() => screenshotFields(duplicate, "user-1", true)).toThrow("more than once");
    const foreign = new FormData(); add(foreign, "chart", "HTF");
    expect(() => screenshotFields(foreign, "user-2", true)).toThrow("Invalid screenshot");
  });
  it("retains uncategorized legacy images and accepts removing every image", () => {
    const form = new FormData(); add(form, "legacy"); add(form, "higher", "HTF");
    expect(screenshotFields(form, "user-1", true).map(image => image.timeframe)).toEqual([null, "HTF"]);
    expect(screenshotFields(new FormData(), "user-1", true)).toEqual([]);
  });
  it("round-trips multiple hindsight charts and reads older single-image reviews", () => {
    const first = { objectKey: "tfxzella/users/user-1/one", mimeType: "image/png", size: 1234 };
    const second = { ...first, objectKey: "tfxzella/users/user-1/two" };
    const review = buildHindsightTrade({period:"DAILY",symbol:"MNQ",direction:"LONG",entryTime:"09:30",rationale:"Confirmation",images:[first,second],userId:"user-1"});
    expect(hindsightImages(JSON.parse(JSON.stringify(review)))).toEqual([first,second]);
    expect(hindsightImages({image:first})).toEqual([first]);
    expect(hindsightImages({image:first,images:[]})).toEqual([]);
    expect(buildHindsightTrade({period:"DAILY",symbol:"",direction:"",entryTime:"",rationale:"",images:[],userId:"user-1"})).toBeNull();
  });
});
