"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { updateDisplayName } from "@/lib/actions/profile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/lib/types";

const ROLE_LABEL: Record<UserRole, string> = {
  student: "Student",
  faculty: "Faculty",
  dean: "Dean",
};

type ProfileClientProps = {
  initialName: string;
  email: string;
  role: UserRole;
  memberSinceLabel: string;
  revalidateBase: string;
  settingsHref: string;
};

export function ProfileClient({
  initialName,
  email,
  role,
  memberSinceLabel,
  revalidateBase,
  settingsHref,
}: ProfileClientProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; ok?: boolean } | null, formData: FormData) =>
      updateDisplayName(formData),
    null,
  );

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state?.ok, router]);

  const initial = initialName.trim() || email.split("@")[0] || "?";

  return (
    <div className="space-y-8 p-6 md:p-8">
      <Card className="border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
        <CardHeader className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="bg-surface-container-highest text-primary ring-surface-container-low flex size-24 shrink-0 items-center justify-center rounded-xl text-2xl font-black ring-4 shadow-sm">
              {initial.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="text-secondary mb-1 text-[10px] font-bold tracking-[0.12em] uppercase">
                Full name
              </p>
              <CardTitle className="text-primary text-2xl font-extrabold tracking-tight">
                {initialName || email}
              </CardTitle>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge className="bg-primary-fixed text-on-primary-fixed rounded-md px-3 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                  {ROLE_LABEL[role]}
                </Badge>
                <span className="text-secondary text-sm font-medium">
                  Member since {memberSinceLabel}
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" asChild className="shrink-0 font-bold">
            <Link href={settingsHref}>
              <UserRound className="size-4" aria-hidden />
              Settings
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="border-outline-variant/10 space-y-6 border-t pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border-outline-variant/10 space-y-1 border-b pb-3">
              <p className="text-secondary text-[10px] font-bold tracking-[0.12em] uppercase">
                University email
              </p>
              <p className="text-on-surface font-medium">{email || "—"}</p>
            </div>
            <div className="border-outline-variant/10 space-y-1 border-b pb-3">
              <p className="text-secondary text-[10px] font-bold tracking-[0.12em] uppercase">
                Account ID
              </p>
              <p className="text-on-surface font-mono text-sm font-medium break-all">
                {email ? "Linked to your sign-in email" : "—"}
              </p>
            </div>
          </div>

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="revalidateBase" value={revalidateBase} />
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="text-secondary text-[10px] font-bold tracking-[0.12em] uppercase">
                Display name
              </Label>
              <Input
                id="profile-name"
                name="name"
                defaultValue={initialName}
                maxLength={120}
                required
                autoComplete="name"
                className="max-w-md border-outline-variant/30 bg-surface-container-lowest"
              />
              <p className="text-secondary text-xs">
                This name appears in the workspace header and project views.
              </p>
            </div>
            {state?.error ? (
              <Alert>
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            ) : null}
            {state?.ok ? (
              <Alert className="border-outline-variant/20 bg-surface-container-high">
                <AlertDescription>Display name saved.</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" disabled={pending} className="font-bold">
              {pending ? "Saving…" : "Save display name"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
