import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "NGO Office Automation System",
  description: "Complete MIS + HRIS + PMS for NGOs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col font-sans">
        <LanguageProvider>
          <TooltipProvider>
            {children}
            <Toaster position="top-right" />
          </TooltipProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
