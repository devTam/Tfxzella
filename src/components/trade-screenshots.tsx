import { ScreenshotUpload, type InitialScreenshot } from "./screenshot-upload";
import { MAX_SCREENSHOTS, TIMEFRAMES, TIMEFRAME_LABELS, type Timeframe } from "@/lib/screenshots";

type TradeImage = InitialScreenshot & { timeframe: Timeframe | null };
export function TradeScreenshots({ initialImages = [] }: { initialImages?: TradeImage[] }) {
  const legacy = initialImages.filter(image => !image.timeframe);
  return <>
    <input type="hidden" name="replaceTradeScreenshots" value="true"/>
    {TIMEFRAMES.map(timeframe => <ScreenshotUpload key={timeframe} label={TIMEFRAME_LABELS[timeframe]} timeframe={timeframe} initialImages={initialImages.filter(image => image.timeframe === timeframe)}/>)}
    {legacy.length ? <ScreenshotUpload label="Earlier screenshots · uncategorized" maxImages={Math.max(MAX_SCREENSHOTS, legacy.length)} initialImages={legacy}/> : null}
  </>;
}
