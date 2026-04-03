import { Badge } from "@/components/ui/badge";
import type { PaymentRowStatus, ProjectStatus } from "@/lib/types";

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  if (status === "pending") {
    return <Badge variant="pending">Pending</Badge>;
  }
  if (status === "rejected") {
    return <Badge variant="rejected">Rejected</Badge>;
  }
  return <Badge variant="default">Approved</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentRowStatus }) {
  if (status === "paid") {
    return <Badge variant="paid">Paid</Badge>;
  }
  return <Badge variant="pending">Pending</Badge>;
}
