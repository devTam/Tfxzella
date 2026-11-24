import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { v2 as cloudinary } from "cloudinary";

// Always scope destructive operations to the authenticated owner.
export async function permanentlyDeleteTrades(userId: string, scope: { id: string } | { accountId: string }) {
  const where: Prisma.TradeWhereInput = {
    account: { userId },
    ...("id" in scope ? { id: scope.id } : { accountId: scope.accountId, source: "LIVE" }),
  };
  const attachments = await db.attachment.findMany({ where: { trade: where }, select: { objectKey: true } });
  if (attachments.length) {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error("Screenshot storage must be configured before permanently deleting trades with screenshots.");
    }
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
    for (const attachment of attachments) {
      const result = await cloudinary.uploader.destroy(attachment.objectKey, { resource_type: "image", type: "authenticated", invalidate: true });
      if (result.result !== "ok" && result.result !== "not found") throw new Error("Could not delete a trade screenshot. Please try again.");
    }
  }
  return db.$transaction(async tx => {
    // Execution.trade uses SetNull, so explicitly remove fills before trades.
    await tx.execution.deleteMany({ where: { trade: where } });
    // Screenshot records and trade tags cascade with their trade.
    return tx.trade.deleteMany({ where });
  });
}
