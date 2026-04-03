"use client";

import Link from "next/link";
import { Bell, IdCard, LogOut, Shield } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { UserRole } from "@/lib/types";

const ROLE_LABEL: Record<UserRole, string> = {
  student: "Student",
  faculty: "Faculty",
  dean: "Dean",
};

type SettingsClientProps = {
  email: string;
  role: UserRole;
  profileHref: string;
};

export function SettingsClient({ email, role, profileHref }: SettingsClientProps) {
  return (
    <div className="space-y-8 p-6 md:p-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-outline-variant/10 bg-surface-container-lowest">
          <CardHeader>
            <div className="flex items-center gap-2">
              <IdCard className="text-primary size-5" aria-hidden />
              <CardTitle className="text-lg">Account</CardTitle>
            </div>
            <CardDescription>
              Profile details and how your name appears in the platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-secondary text-sm">
              Signed in as{" "}
              <span className="text-on-surface font-medium">{email || "—"}</span>
              <span className="text-secondary"> · </span>
              <span className="text-on-surface font-medium">
                {ROLE_LABEL[role]}
              </span>
            </p>
            <Button variant="outline" asChild className="font-bold">
              <Link href={profileHref}>Edit profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-outline-variant/10 bg-surface-container-lowest">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="text-primary size-5" aria-hidden />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
            <CardDescription>
              Email and in-app alerts will be configurable here in a future
              release.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-secondary text-sm">
              You will still receive required messages about project approvals
              and payments from your institution&apos;s workflow.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-outline-variant/10 bg-surface-container-lowest">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="text-primary size-5" aria-hidden />
            <CardTitle className="text-lg">Session</CardTitle>
          </div>
          <CardDescription>Sign out on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4 bg-outline-variant/20" />
          <form action={signOut}>
            <Button
              type="submit"
              variant="destructive"
              className="font-bold"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
