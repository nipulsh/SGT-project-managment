"use client";

import { useEffect } from "react";

/** Scrolls the matching disbursement card into view (e.g. after approving a grant). */
export function ScrollToDeanPaymentCard({
  projectId,
}: {
  projectId: string | null;
}) {
  useEffect(() => {
    if (!projectId) return;
    const id = window.requestAnimationFrame(() => {
      document
        .getElementById(`dean-pay-${projectId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [projectId]);
  return null;
}
