import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { signUpWithPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function SignupPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="bg-surface text-on-surface min-h-screen">
      <div className="flex min-h-screen items-center justify-center p-6 sm:p-12">
        <div className="bg-surface-container-low w-full max-w-lg rounded-xl p-8 md:p-12">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/login"
              className="text-secondary hover:text-primary text-sm font-medium"
            >
              ← Back to login
            </Link>
          </div>
          <h1 className="text-primary mb-2 text-2xl font-bold">
            Create portal access
          </h1>
          <p className="text-secondary mb-6 text-sm">
            Your role is stored securely. In production, restrict faculty and dean
            signup or provision accounts administratively.
          </p>

          <GoogleSignInButton next="/dashboard" className="mb-8" />

          {error ? (
            <Alert variant="default" className="mb-6">
              <AlertCircle className="text-error size-4 shrink-0" aria-hidden />
              <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
            </Alert>
          ) : null}

          <form action={signUpWithPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" name="name" required placeholder="Ada Lovelace" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@university.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                required
                defaultValue="student"
                className="border-outline-variant focus:border-secondary w-full border-0 border-b-2 bg-surface-container-low py-2 text-sm font-medium text-on-surface"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="dean">Dean</option>
              </select>
            </div>
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
