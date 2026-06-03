import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your invoice pipeline — extraction, review, and analytics.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
