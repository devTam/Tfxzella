import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { ToastCoordinator } from "@/components/toast-coordinator";
import { InteractionFeedback } from "@/components/interaction-feedback";
import "./globals.css";
import "./reports.css";
import "./responsive.css";
export const metadata:Metadata={title:{default:"TFXZella — Trade with clarity",template:"%s · TFXZella"},description:"A focused, free trading journal for deliberate traders."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body suppressHydrationWarning>{children}<InteractionFeedback/><Suspense><ToastCoordinator/></Suspense><Toaster theme="dark" richColors position="top-right" closeButton/></body></html>}
