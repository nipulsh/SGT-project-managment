"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  allocateFunding,
  approveProjectWithFunding,
  markPaymentPaid,
  setProjectStatus,
} from "@/lib/actions/dean";
import { formatMoney } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import type { ProfileRow } from "@/lib/types";

function Err({ m }: { m: string | null }) {
  if (!m) return null;
  return (
    <Alert variant="default" className="mb-3">
      <AlertCircle className="text-error size-4 shrink-0" aria-hidden />
      <AlertDescription>{m}</AlertDescription>
    </Alert>
  );
}

export function DeanProjectDecision({
  projectId,
  faculty,
  fundsRequested,
}: {
  projectId: string;
  faculty: Pick<ProfileRow, "id" | "name">[];
  fundsRequested: number | null;
}) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [facultyId, setFacultyId] = useState<string>("");
  const [pending, setPending] = useState(false);
  const hasRequested =
    fundsRequested != null &&
    Number.isFinite(fundsRequested) &&
    fundsRequested > 0;
  const [grantMode, setGrantMode] = useState<"none" | "award">(
    hasRequested ? "award" : "none",
  );
  const [grantAmount, setGrantAmount] = useState(
    hasRequested ? String(fundsRequested) : "",
  );

  async function rejectProject() {
    setErr(null);
    setPending(true);
    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("status", "rejected");
    const res = await setProjectStatus(fd);
    setPending(false);
    if (res.ok) router.refresh();
    else setErr(res.message);
  }

  async function approveProject() {
    setErr(null);
    if (grantMode === "award") {
      const n = Number(grantAmount);
      if (!Number.isFinite(n) || n <= 0) {
        setErr("Enter an approved grant amount greater than zero");
        return;
      }
      if (hasRequested && n > fundsRequested! + 1e-9) {
        setErr("Amount cannot exceed the requested grant");
        return;
      }
    }
    setPending(true);
    const fd = new FormData();
    fd.set("project_id", projectId);
    fd.set("grant_mode", grantMode);
    if (facultyId) fd.set("faculty_id", facultyId);
    if (grantMode === "award") fd.set("approved_amount", grantAmount.trim());
    const res = await approveProjectWithFunding(fd);
    setPending(false);
    if (res.ok) {
      if (grantMode === "award") {
        router.push(
          `/dashboard/dean/payments?complete=${encodeURIComponent(projectId)}`,
        );
      } else {
        router.refresh();
      }
    } else setErr(res.message);
  }

  const awardBlocked =
    grantMode === "award" &&
    (!grantAmount.trim() ||
      !Number.isFinite(Number(grantAmount)) ||
      Number(grantAmount) <= 0 ||
      (hasRequested && Number(grantAmount) > fundsRequested! + 1e-9));

  return (
    <div className="space-y-4">
      <Err m={err} />
      {faculty.length > 0 ? (
        <div className="space-y-2">
          <Label>Assign faculty (optional)</Label>
          <Select value={facultyId} onValueChange={setFacultyId}>
            <SelectTrigger>
              <SelectValue placeholder="Select faculty advisor" />
            </SelectTrigger>
            <SelectContent>
              {faculty.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <Separator className="bg-outline-variant/20" />

      <div className="space-y-3">
        <div>
          <h3 className="text-primary text-sm font-bold tracking-wide uppercase">
            Grant / disbursement
          </h3>
          <p className="text-secondary mt-1 text-xs">
            Decide institutional funding before approving. You can award less
            than requested or approve without a grant.
          </p>
        </div>
        {hasRequested ? (
          <p className="text-secondary text-xs">
            Requested on application:{" "}
            <span className="text-primary font-semibold">
              {formatMoney(fundsRequested!)}
            </span>
          </p>
        ) : (
          <p className="text-secondary text-xs">
            No grant amount was requested. You can still award funding below, or
            choose no grant.
          </p>
        )}
        <div className="space-y-2">
          <label className="border-outline-variant/20 hover:bg-surface-container-high/80 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors">
            <input
              type="radio"
              name={`grant-${projectId}`}
              className="text-primary mt-0.5"
              checked={grantMode === "none"}
              onChange={() => setGrantMode("none")}
            />
            <span className="text-sm">
              <span className="text-primary font-semibold">No grant</span>
              <span className="text-secondary block text-xs">
                Reject funding for this cycle; the project is still approved.
                It will not appear in pending disbursements.
              </span>
            </span>
          </label>
          <label className="border-outline-variant/20 hover:bg-surface-container-high/80 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors">
            <input
              type="radio"
              name={`grant-${projectId}`}
              className="text-primary mt-0.5"
              checked={grantMode === "award"}
              onChange={() => setGrantMode("award")}
            />
            <span className="text-sm">
              <span className="text-primary font-semibold">Award grant</span>
              <span className="text-secondary block text-xs">
                Set the approved amount (at or below the request if one was
                provided). After you approve, you will go to payment processing
                to transfer funds and upload payment proof.
              </span>
            </span>
          </label>
        </div>
        {grantMode === "award" ? (
          <div className="space-y-2">
            <Label htmlFor={`grant-amt-${projectId}`}>
              Approved grant (INR)
            </Label>
            <Input
              id={`grant-amt-${projectId}`}
              type="number"
              step="0.01"
              min="0.01"
              max={hasRequested ? fundsRequested! : undefined}
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
              placeholder={hasRequested ? undefined : "Enter amount"}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button variant="ghost" className="text-secondary" asChild>
          <Link href={`/dashboard/dean/projects/${projectId}`}>
            View details
          </Link>
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={() => rejectProject()}
        >
          Reject project
        </Button>
        <Button
          type="button"
          disabled={pending || awardBlocked}
          onClick={() => approveProject()}
        >
          Approve project
        </Button>
      </div>
    </div>
  );
}

export function DeanAllocateForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const res = await allocateFunding(fd);
    setPending(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else setErr(res.message);
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Err m={err} />
      <input type="hidden" name="project_id" value={projectId} />
      <div>
        <Label htmlFor="amt">Approved budget (INR)</Label>
        <Input
          id="amt"
          name="approved_amount"
          type="number"
          step="0.01"
          min="0"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Confirm budget allocation"}
      </Button>
    </form>
  );
}

export function DeanMarkPaidForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const receiptFieldId = `dean-payment-proof-${projectId}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const res = await markPaymentPaid(fd);
    setPending(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else setErr(res.message);
  }

  return (
    <form
      className="space-y-4"
      encType="multipart/form-data"
      onSubmit={onSubmit}
    >
      <Err m={err} />
      <input type="hidden" name="project_id" value={projectId} />
      <div>
        <Label htmlFor={receiptFieldId}>
          Payment proof (screenshot or PDF)
        </Label>
        <p className="text-secondary mb-2 text-xs">
          Upload confirmation from your bank app or net banking after you send
          the grant.
        </p>
        <Input
          id={receiptFieldId}
          name="receipt"
          type="file"
          required
          accept="image/*,application/pdf"
          className="border-outline-variant/30 bg-surface-container-lowest py-2"
        />
      </div>
      <Button type="submit" className="w-full bg-secondary" disabled={pending}>
        {pending ? "Saving…" : "Submit payment proof"}
      </Button>
    </form>
  );
}
