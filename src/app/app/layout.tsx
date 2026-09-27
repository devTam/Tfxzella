import { AppShell } from "@/components/app-shell"; import { viewer } from "@/lib/data";
export default async function Layout({children}:{children:React.ReactNode}){const user=await viewer();return <AppShell name={user.name}>{children}</AppShell>}
