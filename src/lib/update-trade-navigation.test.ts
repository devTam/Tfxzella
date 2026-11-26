import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks=vi.hoisted(()=>({owned:vi.fn(),count:vi.fn(),update:vi.fn(),redirect:vi.fn(),batch:vi.fn()}));
vi.mock("@/auth",()=>({auth:async()=>({user:{id:"owner"}})}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{mocks.redirect(url);throw new Error(`redirect:${url}`)}}));
vi.mock("@/lib/db",()=>({db:{
  trade:{findFirst:mocks.owned,count:mocks.count},
  tradingAccount:{findFirst:async()=>({id:"account"})},
  tag:{findMany:async()=>[]},
  instrument:{upsert:async()=>({id:"instrument",pointValue:"2"})},
  importBatch:{findFirst:mocks.batch},
  $transaction:async(callback:(tx:unknown)=>Promise<void>)=>callback({execution:{deleteMany:vi.fn()},trade:{update:mocks.update}}),
}}));
import { updateTrade } from "@/app/actions";

function form(){
  const data=new FormData();
  for(const [key,value] of Object.entries({id:"trade-b",accountId:"account",symbol:"MNQ",assetClass:"FUTURE",direction:"LONG",quantity:"1",entry:"100",exit:"110",openedAt:"2026-11-06T09:30",closedAt:"2026-11-06T10:00"}))data.set(key,value);
  return data;
}
beforeEach(()=>{vi.clearAllMocks();mocks.owned.mockResolvedValue({id:"trade-b",backtestSessionId:null});mocks.count.mockResolvedValue(4)});

describe("edited trade navigation",()=>{
  it("returns a live trade to its own detail page",async()=>{
    await expect(updateTrade(form())).rejects.toThrow("redirect:/app/journal/trade-b");
    expect(mocks.update).toHaveBeenCalled();
  });
  it("returns a backtest trade to its updated chronological position",async()=>{
    mocks.owned.mockResolvedValue({id:"trade-b",backtestSessionId:"session"});
    await expect(updateTrade(form())).rejects.toThrow("redirect:/app/backtests/session?page=5");
    expect(mocks.count).toHaveBeenCalledWith({where:{account:{userId:"owner"},backtestSessionId:"session",deletedAt:null,OR:[{openedAt:{lt:new Date("2026-11-06T14:30:00Z")}},{openedAt:new Date("2026-11-06T14:30:00Z"),id:{lt:"trade-b"}}]}});
  });
  it("preserves the explicit save-and-next imported trade workflow",async()=>{
    const data=form();data.set("importBatchId","batch");data.set("nextImportTradeId","trade-c");
    mocks.batch.mockResolvedValue({mapping:{tradeIds:["trade-b","trade-c"]}});
    await expect(updateTrade(data)).rejects.toThrow("redirect:/app/journal/trade-c/edit?importBatch=batch");
  });
});
