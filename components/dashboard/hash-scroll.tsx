"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function scrollToDashboardHash() {
  if (typeof window === "undefined") return;
  const hash = window.location.hash;
  if (!hash || hash.length < 2) return;
  const id = decodeURIComponent(hash.slice(1));
  const targetHash = hash;
  let attempts = 0;
  const maxAttempts = 80;

  const tick = () => {
    if (window.location.hash !== targetHash) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (attempts++ < maxAttempts) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const run = () => requestAnimationFrame(() => scrollToDashboardHash());
    run();
    window.addEventListener("hashchange", scrollToDashboardHash);
    return () => window.removeEventListener("hashchange", scrollToDashboardHash);
  }, [pathname]);

  return null;
}
