"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";

export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      className="flex min-h-0 flex-1 flex-col"
      initial="initial"
      animate="animate"
      variants={pageTransition}
    >
      {children}
    </motion.div>
  );
}
