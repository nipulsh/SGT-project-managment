import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <header className="border-outline-variant/10 flex items-center justify-between border-b px-6 py-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="bg-surface-container-highest flex h-10 w-10 items-center justify-center rounded-lg">
            <Landmark className="text-primary size-5" aria-hidden />
          </div>
          <span className="text-primary text-lg font-bold tracking-tight">
            Project Monolith
          </span>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
        <p className="text-secondary mb-4 text-xs font-bold tracking-[0.2em] uppercase">
          University project management
        </p>
        <h1 className="text-primary mb-6 text-4xl font-extrabold tracking-tighter md:text-6xl">
          One workspace for every university project
        </h1>
        <p className="text-secondary mx-auto mb-10 max-w-xl text-lg leading-relaxed">
          Students create projects, track milestones and expenses, and submit
          payment details. Faculty follow along in read-only mode. The dean
          approves work, allocates budgets, and records payouts with receipts.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/signup">
              Get started
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/login">Institutional login</Link>
          </Button>
        </div>
      </main>

      <footer className="text-secondary border-outline-variant/10 flex flex-col items-center gap-4 border-t py-12">
        <p className="text-[0.75rem] opacity-70">
          UI tokens from{" "}
          <code className="text-primary">designs/stitch/scholarslate</code>
        </p>
      </footer>
    </div>
  );
}
