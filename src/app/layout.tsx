import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import "./reports.css";
import "./responsive.css";
export const metadata:Metadata={title:{default:"TFXZella — Trade with clarity",template:"%s · TFXZella"},description:"A focused, free trading journal for deliberate traders."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning>{children}<Toaster theme="dark" richColors/></body></html>}
