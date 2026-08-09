import { Sidebar } from "@/components/features/layout/sidebar";
import { CommandPalette } from "@/components/features/layout/command-palette";
import { PageTransitionWrapper } from "@/components/features/layout/page-transition";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <PageTransitionWrapper>{children}</PageTransitionWrapper>
      </div>
      <CommandPalette />
    </div>
  );
}
