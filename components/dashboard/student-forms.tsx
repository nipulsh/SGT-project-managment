"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addExpense,
  addProgressUpdate,
  savePaymentDetails,
} from "@/lib/actions/student";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Alert variant="default" className="mb-4">
      <AlertCircle className="text-error size-4 shrink-0" aria-hidden />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function MilestoneForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const res = await addProgressUpdate(fd);
    setPending(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else setError(res.message);
  }

  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <FormAlert message={error} />
      <input type="hidden" name="project_id" value={projectId} />
      <div>
        <Label htmlFor="m-title">Milestone title</Label>
        <Input
          id="m-title"
          name="title"
          required
          placeholder="e.g. Preliminary data validation"
        />
      </div>
      <div>
        <Label htmlFor="m-desc">Technical description</Label>
        <Textarea
          id="m-desc"
          name="description"
          rows={3}
          placeholder="Details of the achievement…"
        />
      </div>
      <Button type="submit" size="sm" className="w-full uppercase" disabled={pending}>
        {pending ? "Saving…" : "Submit update"}
      </Button>
    </form>
  );
}

export function ExpenseForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const res = await addExpense(fd);
    setPending(false);
    if (res.ok) {
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } else setError(res.message);
  }

  return (
    <form
      className="space-y-5"
      encType="multipart/form-data"
      onSubmit={onSubmit}
    >
      <FormAlert message={error} />
      <input type="hidden" name="project_id" value={projectId} />
      <div>
        <Label htmlFor="amount">Amount (INR)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
        />
      </div>
      <div>
        <Label htmlFor="e-desc">Description</Label>
        <Textarea id="e-desc" name="description" rows={2} />
      </div>
      <div>
        <Label htmlFor="bill">Bill upload</Label>
        <Input
          id="bill"
          name="bill"
          type="file"
          accept="image/*,application/pdf"
          className="border-outline-variant/30 bg-surface-container-lowest py-2"
        />
      </div>
      <Button type="submit" size="sm" className="w-full uppercase" disabled={pending}>
        {pending ? "Uploading…" : "Log expense"}
      </Button>
    </form>
  );
}

export function BankDetailsForm({
  projectId,
  defaults,
}: {
  projectId: string;
  defaults: {
    account_number: string;
    ifsc: string;
    holder_name: string;
    paytm_qr_url?: string | null;
  } | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const res = await savePaymentDetails(fd);
    setPending(false);
    if (res.ok) router.refresh();
    else setError(res.message);
  }

  return (
    <form
      className="space-y-5"
      encType="multipart/form-data"
      onSubmit={onSubmit}
    >
      <FormAlert message={error} />
      <input type="hidden" name="project_id" value={projectId} />
      <div>
        <Label htmlFor="holder">Account holder</Label>
        <Input
          id="holder"
          name="holder_name"
          required
          defaultValue={defaults?.holder_name}
        />
      </div>
      <div>
        <Label htmlFor="acct">Account number</Label>
        <Input
          id="acct"
          name="account_number"
          required
          defaultValue={defaults?.account_number}
        />
      </div>
      <div>
        <Label htmlFor="ifsc">IFSC</Label>
        <Input id="ifsc" name="ifsc" required defaultValue={defaults?.ifsc} />
      </div>
      <div>
        <Label htmlFor="qr">Bank / UPI QR image</Label>
        <Input
          id="qr"
          name="qr"
          type="file"
          accept="image/*"
          className="border-outline-variant/30 bg-surface-container-lowest py-2"
        />
      </div>
      <div>
        <Label htmlFor="paytm_qr">Paytm / wallet QR (optional)</Label>
        <Input
          id="paytm_qr"
          name="paytm_qr"
          type="file"
          accept="image/*"
          className="border-outline-variant/30 bg-surface-container-lowest py-2"
        />
      </div>
      <Button type="submit" size="sm" className="w-full uppercase" disabled={pending}>
        {pending ? "Saving…" : "Save payment profile"}
      </Button>
    </form>
  );
}
