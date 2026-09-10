"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function MarketingNavbar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Product", href: "/#product" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-ring">
          <motion.div
            className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden shadow-[0_0_20px_hsl(228,100%,64%,0.4)]"
            whileHover={{ scale: 1.08, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image
              src="/images/logo_image.png"
              alt="GetYourClients"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          </motion.div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">
            GetYour<span className="gradient-text">Clients</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "hover:text-foreground transition-colors duration-150 relative py-1",
                  isActive && "text-foreground font-semibold"
                )}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-medium hover:bg-muted/80">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="font-semibold shadow-md shadow-primary/20">
              Get started free
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
