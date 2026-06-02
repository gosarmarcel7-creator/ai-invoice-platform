import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "DocuExtract AI — Automated Invoice Processing",
  description: "AI-powered invoice data extraction, validation, and approval platform for modern finance teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-[var(--font-inter)] antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid #e7e5e2",
              color: "#0c0a09",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
