import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DocuExtract — AI Invoice Processing",
  description: "AI-powered invoice data extraction, validation, and approval for modern finance teams.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#ffffff",
              border: "1px solid rgba(33, 34, 38, 0.12)",
              color: "#121317",
              boxShadow: "0 8px 24px rgba(33, 34, 38, 0.1)",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
