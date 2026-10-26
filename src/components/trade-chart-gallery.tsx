import Image from "next/image";
import { chartImageUrl } from "@/lib/chart-images";
import { TIMEFRAMES, TIMEFRAME_LABELS, type Timeframe } from "@/lib/screenshots";

type Chart = { id: string; objectKey: string; timeframe: Timeframe | null };
export function TradeChartGallery({ attachments }: { attachments: Chart[] }) {
  if (!attachments.length) return <div className="empty">No trade screenshots attached yet.</div>;
  return <div className="grid section">{[...TIMEFRAMES, null].map(timeframe => {
    const charts = attachments.filter(chart => chart.timeframe === timeframe);
    if (!charts.length) return null;
    const label = timeframe ? TIMEFRAME_LABELS[timeframe] : "Earlier screenshots · uncategorized";
    return <section key={timeframe || "legacy"}><h3>{label}</h3><div className="trade-images">{charts.map((chart, index) => {
      const url = chartImageUrl(chart.objectKey);
      return <a href={url} key={chart.id} target="_blank" rel="noreferrer"><Image src={url} alt={`${label} screenshot ${index + 1}`} width={900} height={520} sizes="(max-width: 900px) 100vw, 700px" unoptimized/></a>;
    })}</div></section>;
  })}</div>;
}
