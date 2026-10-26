import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { TradeScreenshots } from "./trade-screenshots";

it("renders separate multi-select inputs and preserves each saved timeframe", () => {
  const html = renderToStaticMarkup(createElement(TradeScreenshots, { initialImages: [
    {key:"higher",mimeType:"image/png",size:100,preview:"https://example.com/chart.png",timeframe:"HTF"},
    {key:"legacy",mimeType:"image/png",size:100,preview:"https://example.com/old.png",timeframe:null},
  ] }));
  for (const label of ["Higher time frame", "Middle time frame", "Lower time frame", "Earlier screenshots"]) expect(html).toContain(label);
  expect(html.match(/multiple=""/g)).toHaveLength(4);
  expect(html).toContain('name="attachmentTimeframe" value="HTF"');
  expect(html).toContain('name="attachmentKey" value="legacy"');
  expect(html).toContain('name="replaceTradeScreenshots" value="true"');
});
