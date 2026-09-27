import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";
import { z } from "zod";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [Credentials({ credentials:{ email:{},password:{} }, authorize: async (raw) => {
    const parsed=z.object({email:z.string().email(),password:z.string().min(8)}).safeParse(raw);
    if(!parsed.success) return null;
    const user=await db.user.findUnique({where:{email:parsed.data.email.toLowerCase()}});
    if(!user || !(await verify(user.passwordHash,parsed.data.password))) return null;
    return {id:user.id,email:user.email,name:user.name,image:user.image};
  }})],
  callbacks:{ session({session,token}) { if(session.user) session.user.id=token.sub!; return session; } }
});
