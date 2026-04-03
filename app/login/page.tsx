import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Landmark,
  Mail,
} from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { signInWithPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = { searchParams: Promise<{ error?: string; notice?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { error, notice } = await searchParams;

  return (
    <main className="bg-surface text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen">
      <div className="flex min-h-screen items-center justify-center p-6 sm:p-12">
        <div className="bg-surface-container-low w-full max-w-5xl overflow-hidden rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row">
            <div className="brand-gradient relative hidden w-full flex-col justify-between overflow-hidden p-12 md:flex md:w-1/2">
              <div className="relative z-10">
                <div className="mb-12 flex items-center gap-3">
                  <div className="bg-surface-container-highest flex h-10 w-10 items-center justify-center rounded-lg">
                    <Landmark className="text-primary size-5" aria-hidden />
                  </div>
                  <h1 className="text-surface text-xl font-bold tracking-tight">
                    Project Monolith
                  </h1>
                </div>
                <div className="space-y-6">
                  <p className="text-primary-fixed max-w-sm text-4xl leading-tight font-extrabold tracking-tighter md:text-5xl">
                    Your projects, <br />
                    one place.
                  </p>
                  <p className="text-on-primary-container max-w-sm text-lg leading-relaxed">
                    Manage project submissions, milestones, expenses, and
                    budgets in one institutional workspace.
                  </p>
                </div>
              </div>
              <p className="text-on-primary-container relative z-10 text-[0.75rem] tracking-wide">
                University project management platform
              </p>
              <div className="bg-secondary-container/10 absolute -right-24 -bottom-24 h-96 w-96 rounded-full blur-3xl" />
            </div>

            <div className="bg-surface-container-lowest w-full p-8 md:w-1/2 md:p-16">
              <div className="mb-10 flex items-center justify-between">
                <div className="bg-surface-container-low flex items-center gap-1 rounded-lg p-1">
                  <span className="bg-surface-container-lowest text-primary rounded-md px-6 py-2 text-sm font-bold shadow-sm">
                    Login
                  </span>
                  <Link
                    href="/signup"
                    className="text-secondary hover:text-primary px-6 py-2 text-sm font-medium transition-colors"
                  >
                    Signup
                  </Link>
                </div>
                <span className="text-secondary text-[0.75rem] font-bold tracking-[0.05em] uppercase">
                  Secure portal
                </span>
              </div>

              <header className="mb-8">
                <h2 className="text-primary mb-2 text-2xl font-bold">Welcome back</h2>
                <p className="text-secondary text-sm font-medium">
                  Enter your credentials to access your dashboard.
                </p>
              </header>

              {error ? (
                <Alert variant="default" className="mb-6">
                  <AlertCircle className="text-error size-4 shrink-0" aria-hidden />
                  <AlertDescription>
                    {error === "profile"
                      ? "No profile row found. Run Supabase migration 004_ensure_auth_profile.sql (and ensure 001 trigger exists), then sign in again."
                      : decodeURIComponent(error)}
                  </AlertDescription>
                </Alert>
              ) : null}
              {notice === "confirm-email" ? (
                <Alert variant="muted" className="mb-6">
                  <Mail className="size-4 shrink-0" aria-hidden />
                  <AlertDescription>
                    Check your inbox to confirm your email, then sign in.
                  </AlertDescription>
                </Alert>
              ) : null}
              {notice === "dev-account-ready" ? (
                <Alert variant="muted" className="mb-6">
                  <CheckCircle2 className="size-4 shrink-0" aria-hidden />
                  <AlertDescription>
                    Account created (dev bypass). You can sign in immediately.
                  </AlertDescription>
                </Alert>
              ) : null}

              <form action={signInWithPassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@university.edu"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <span className="text-secondary text-[0.75rem] font-medium opacity-60">
                      Forgot? (IT support)
                    </span>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </div>
                <div className="pt-4">
                  <Button type="submit" className="w-full gap-2 py-6 text-base">
                    Sign in
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </form>

              <div className="mt-8 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-outline-variant/30 h-[1px] flex-1" />
                  <span className="text-outline text-[0.75rem] font-bold tracking-[0.05em] uppercase">
                    Or continue with
                  </span>
                  <div className="bg-outline-variant/30 h-[1px] flex-1" />
                </div>
                <GoogleSignInButton next="/dashboard" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
