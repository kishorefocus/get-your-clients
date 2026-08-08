import Link from "next/link";
import { Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-card">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Globe2 className="h-4 w-4" />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">GlobalReach</span>
        </Link>

        <h1 className="mt-6 font-display text-xl font-semibold">Log in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back — pick up where your team left off.</p>

        <form className="mt-6 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="email">Work email</label>
            <Input id="email" type="email" placeholder="you@company.com" />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="password">Password</label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot?</Link>
            </div>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full" size="lg">Log in</Button>
        </form>

        <Button variant="outline" className="mt-3 w-full" size="lg">Continue with Google</Button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          New to GlobalReach? <Link href="/signup" className="text-primary hover:underline">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
