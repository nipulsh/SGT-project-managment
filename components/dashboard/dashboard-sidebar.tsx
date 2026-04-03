"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Banknote,
  BookMarked,
  FilePlus,
  Landmark,
  LayoutDashboard,
  LogOut,
  Network,
  Settings,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { scrollToDashboardHash } from "@/components/dashboard/hash-scroll";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

type NavItem = { href: string; label: string; icon: LucideIcon };

function navItemActive(item: NavItem, pathname: string, hashRaw: string) {
  if (!item.href.includes("#")) {
    return pathname === item.href;
  }
  const [path, frag] = item.href.split("#");
  if (pathname !== path) return false;
  const current = hashRaw || "#overview";
  if (!frag) return true;
  return current === `#${frag}`;
}

const NAV: Record<UserRole, NavItem[]> = {
  student: [
    {
      href: "/dashboard/student#overview",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/student/projects/new",
      label: "New application",
      icon: FilePlus,
    },
    {
      href: "/dashboard/student#project",
      label: "Project",
      icon: Network,
    },
    {
      href: "/dashboard/student#milestones",
      label: "Milestones",
      icon: BookMarked,
    },
    {
      href: "/dashboard/student#expenses",
      label: "Expenses",
      icon: Banknote,
    },
    {
      href: "/dashboard/student#funding",
      label: "Funding",
      icon: Wallet,
    },
    {
      href: "/dashboard/student/profile",
      label: "Profile",
      icon: UserRound,
    },
    {
      href: "/dashboard/student/settings",
      label: "Settings",
      icon: Settings,
    },
  ],
  faculty: [
    {
      href: "/dashboard/faculty#overview",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/faculty#projects",
      label: "Assigned projects",
      icon: Activity,
    },
    {
      href: "/dashboard/faculty/profile",
      label: "Profile",
      icon: UserRound,
    },
    {
      href: "/dashboard/faculty/settings",
      label: "Settings",
      icon: Settings,
    },
  ],
  dean: [
    {
      href: "/dashboard/dean",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/dean/approvals",
      label: "Dean approvals",
      icon: ShieldCheck,
    },
    {
      href: "/dashboard/dean/payments",
      label: "Payments",
      icon: Wallet,
    },
    {
      href: "/dashboard/dean/projects",
      label: "Projects",
      icon: Network,
    },
    {
      href: "/dashboard/dean/profile",
      label: "Profile",
      icon: UserRound,
    },
    {
      href: "/dashboard/dean/settings",
      label: "Settings",
      icon: Settings,
    },
  ],
};

function useHash() {
  const [hash, setHash] = useState("");
  useEffect(() => {
    const read = () => setHash(window.location.hash || "#overview");
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);
  return hash;
}

function sameRouteHashClick(
  e: MouseEvent<HTMLAnchorElement>,
  pathname: string,
  href: string,
) {
  if (!href.includes("#")) return;
  const [path, frag] = href.split("#");
  if (!frag || pathname !== path) return;
  e.preventDefault();
  if (window.location.hash === `#${frag}`) {
    scrollToDashboardHash();
    return;
  }
  window.location.hash = frag;
}

export function DashboardSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const hash = useHash();
  const items = NAV[role];

  return (
    <aside
      className={cn(
        "border-outline-variant/20 fixed top-0 left-0 z-40 hidden h-screen w-64 flex-col border-r bg-surface-container-low p-6 md:flex",
      )}
    >
      <div className="mb-10 flex items-center gap-3">
        <div className="bg-primary flex h-10 w-10 items-center justify-center rounded-xl text-on-primary">
          <Landmark className="size-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-lg font-black text-primary">Projects</h1>
          <p className="text-[10px] font-semibold tracking-[0.05em] text-secondary uppercase opacity-70">
            University workspace
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = navItemActive(item, pathname, hash);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => sameRouteHashClick(e, pathname, item.href)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-xs font-semibold tracking-[0.05em] text-secondary uppercase transition-all duration-200",
                active
                  ? "bg-surface-container-highest font-bold text-on-primary-fixed"
                  : "hover:bg-surface-container-highest/50",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-outline-variant/20 space-y-1 border-t pt-6">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="h-auto w-full justify-start px-4 py-3 text-xs font-semibold tracking-[0.05em] uppercase"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
