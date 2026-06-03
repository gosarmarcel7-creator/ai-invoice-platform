import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DocuExtract — Invoices, understood by AI",
    template: "%s · DocuExtract",
  },
  description:
    "DocuExtract turns any invoice into clean, structured, verified data in seconds. AI extraction, human-in-the-loop review, and real-time analytics for finance teams.",
  keywords: ["invoice automation", "AP automation", "AI invoice extraction", "accounts payable", "finance"],
  openGraph: {
    title: "DocuExtract — Invoices, understood by AI",
    description: "AI-powered invoice extraction, review, and analytics for modern finance teams.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${geistMono.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <MotionProvider>{children}</MotionProvider>
        <Toaster
          position="bottom-right"
          theme="light"
          toastOptions={{
            style: {
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(15,23,42,0.1)",
              backdropFilter: "blur(14px)",
              color: "#0d1526",
            },
          }}
        />
      </body>
    </html>
  );
}
