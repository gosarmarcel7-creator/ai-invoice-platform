import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import AgBackground from "@/components/ag/background/AgBackground";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "DocuExtract — AI Invoice Processing",
  description: "AI-powered invoice data extraction, validation, and approval for modern finance teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        <AgBackground />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "rgba(11,14,31,0.92)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#f4f4ff",
              backdropFilter: "blur(14px)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
