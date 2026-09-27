import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
export async function viewer(){const session=await auth();if(!session?.user?.id)redirect("/login");return session.user}
export async function accounts(){const user=await viewer();return db.tradingAccount.findMany({where:{userId:user.id,archivedAt:null},orderBy:{createdAt:"asc"}})}
