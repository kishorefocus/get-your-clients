"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/features/layout/sidebar";
import { MobileBottomNav } from "@/components/features/layout/mobile-bottom-nav";
import { MobileDrawer } from "@/components/features/layout/mobile-drawer";
import { CommandPalette } from "@/components/features/layout/command-palette";
import { PageTransitionWrapper } from "@/components/features/layout/page-transition";
import { useAuth } from "@/lib/hooks/use-auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show nothing while resolving auth — avoids flash of dashboard content
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden relative">
        <PageTransitionWrapper>{children}</PageTransitionWrapper>
        <MobileBottomNav />
      </div>
      <MobileDrawer />
      <CommandPalette />
    </div>
  );
}
