import AgNavbar from "@/components/ag/layout/AgNavbar";
import AgFooter from "@/components/ag/layout/AgFooter";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AgNavbar />
      <main>{children}</main>
      <AgFooter />
    </>
  );
}
