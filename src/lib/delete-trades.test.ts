import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({attachments:vi.fn(),executions:vi.fn(),trades:vi.fn(),transaction:vi.fn(),destroy:vi.fn(),config:vi.fn()}));
vi.mock("@/lib/db",()=>({db:{attachment:{findMany:mocks.attachments},$transaction:mocks.transaction}}));
vi.mock("cloudinary",()=>({v2:{config:mocks.config,uploader:{destroy:mocks.destroy}}}));
import { permanentlyDeleteTrades } from "./delete-trades";

describe("permanent trade deletion",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();vi.unstubAllEnvs();
  mocks.attachments.mockResolvedValue([]);mocks.executions.mockResolvedValue({count:2});mocks.trades.mockResolvedValue({count:1});
  mocks.transaction.mockImplementation(async callback=>callback({execution:{deleteMany:mocks.executions},trade:{deleteMany:mocks.trades}}));
 });
 it("restricts bulk deletion to the owner's live account and removes fills before trades",async()=>{
  await permanentlyDeleteTrades("user-1",{accountId:"account-1"});
  const where={account:{userId:"user-1"},accountId:"account-1",source:"LIVE"};
  expect(mocks.executions).toHaveBeenCalledWith({where:{trade:where}});
  expect(mocks.trades).toHaveBeenCalledWith({where});
  expect(mocks.executions.mock.invocationCallOrder[0]).toBeLessThan(mocks.trades.mock.invocationCallOrder[0]);
  expect(where).not.toHaveProperty("deletedAt");
 });
 it("restricts individual deletion to the authenticated owner",async()=>{
  await permanentlyDeleteTrades("user-1",{id:"trade-1"});
  expect(mocks.trades).toHaveBeenCalledWith({where:{account:{userId:"user-1"},id:"trade-1"}});
 });
 it("does not delete database records when screenshot deletion fails",async()=>{
  for(const name of ["CLOUDINARY_CLOUD_NAME","CLOUDINARY_API_KEY","CLOUDINARY_API_SECRET"])vi.stubEnv(name,"test");
  mocks.attachments.mockResolvedValue([{objectKey:"screenshot"}]);mocks.destroy.mockResolvedValue({result:"error"});
  await expect(permanentlyDeleteTrades("user-1",{id:"trade-1"})).rejects.toThrow("Could not delete");
  expect(mocks.transaction).not.toHaveBeenCalled();
 });
 it("deletes uploaded screenshots before removing their database references",async()=>{
  for(const name of ["CLOUDINARY_CLOUD_NAME","CLOUDINARY_API_KEY","CLOUDINARY_API_SECRET"])vi.stubEnv(name,"test");
  mocks.attachments.mockResolvedValue([{objectKey:"screenshot"}]);mocks.destroy.mockResolvedValue({result:"ok"});
  await permanentlyDeleteTrades("user-1",{id:"trade-1"});
  expect(mocks.destroy).toHaveBeenCalledWith("screenshot",{resource_type:"image",type:"authenticated",invalidate:true});
  expect(mocks.trades).toHaveBeenCalled();
 });
});
