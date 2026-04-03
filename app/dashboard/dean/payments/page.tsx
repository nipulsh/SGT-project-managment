import { DeanMarkPaidForm } from "@/components/dashboard/dean-forms";
import { ScrollToDeanPaymentCard } from "@/components/dashboard/dean-payments-scroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchDeanPastPaymentsWithTitles,
  fetchDeanPendingDisbursements,
} from "@/lib/dean/queries";
import { formatDate, formatMoney } from "@/lib/format";
import { getSignedFileUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

type Search = { complete?: string };

export default async function DeanPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { complete } = await searchParams;
  const completeId =
    typeof complete === "string" && complete.length > 0 ? complete : null;

  const [pendingRaw, pastWithTitles] = await Promise.all([
    fetchDeanPendingDisbursements(),
    fetchDeanPastPaymentsWithTitles(),
  ]);

  const sorted = [...pendingRaw].sort((a, b) => {
    if (!completeId) return 0;
    if (a.project_id === completeId) return -1;
    if (b.project_id === completeId) return 1;
    return 0;
  });

  const pendingWithQr = await Promise.all(
    sorted.map(async (row) => {
      const pd = row.payment_details;
      const bankQrHref = pd?.qr_code_url
        ? await getSignedFileUrl("qr-codes", pd.qr_code_url)
        : null;
      const paytmQrHref = pd?.paytm_qr_url
        ? await getSignedFileUrl("qr-codes", pd.paytm_qr_url)
        : null;
      return { ...row, bankQrHref, paytmQrHref };
    }),
  );

  const pastWithReceiptLinks = await Promise.all(
    pastWithTitles.map(async (row) => ({
      ...row,
      receiptHref: await getSignedFileUrl("receipts", row.receipt_url),
    })),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-6 md:p-10">
      <ScrollToDeanPaymentCard projectId={completeId} />

      <section className="border-outline-variant/10 scroll-mt-24 rounded-xl border bg-surface-container-lowest p-8">
        <h1 className="text-primary mb-2 text-2xl font-bold md:text-3xl">
          Payment processing
        </h1>
        <p className="text-secondary mb-6 max-w-2xl text-sm">
          Send the approved grant using the student&apos;s bank details or by
          scanning their QR code, then upload a screenshot or PDF of the
          payment confirmation.
        </p>
        {pendingWithQr.length === 0 ? (
          <p className="text-secondary text-sm">No pending disbursements.</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {pendingWithQr.map((row) => (
              <Card
                key={row.id}
                id={`dean-pay-${row.project_id}`}
                className={cn(
                  "border-outline-variant/10 scroll-mt-28",
                  completeId === row.project_id &&
                    "ring-primary ring-offset-surface-container-lowest ring-2 ring-offset-2",
                )}
              >
                <CardHeader>
                  <CardTitle className="text-base">{row.title}</CardTitle>
                  <p className="text-secondary text-sm">
                    Approved grant {formatMoney(row.approved_amount)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-outline-variant/20 bg-surface-container-low space-y-3 rounded-lg border p-4">
                    <p className="text-primary text-xs font-bold tracking-wide uppercase">
                      Pay the student
                    </p>
                    {row.payment_details ? (
                      <>
                        <dl className="grid gap-2 text-sm">
                          <div>
                            <dt className="text-secondary text-xs">
                              Account holder
                            </dt>
                            <dd className="text-primary font-medium">
                              {row.payment_details.holder_name}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-secondary text-xs">
                              Account number
                            </dt>
                            <dd className="text-primary font-mono text-xs tracking-wide">
                              {row.payment_details.account_number}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-secondary text-xs">IFSC</dt>
                            <dd className="text-primary font-mono text-xs uppercase">
                              {row.payment_details.ifsc}
                            </dd>
                          </div>
                        </dl>
                        {row.bankQrHref || row.paytmQrHref ? (
                          <div className="flex flex-wrap gap-6 pt-2">
                            {row.bankQrHref ? (
                              <div>
                                <p className="text-secondary mb-1 text-[10px] font-bold tracking-widest uppercase">
                                  Bank / UPI QR
                                </p>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={row.bankQrHref}
                                  alt="Student bank or UPI QR"
                                  className="border-outline-variant/20 max-h-40 rounded-md border"
                                />
                              </div>
                            ) : null}
                            {row.paytmQrHref ? (
                              <div>
                                <p className="text-secondary mb-1 text-[10px] font-bold tracking-widest uppercase">
                                  Paytm / wallet QR
                                </p>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={row.paytmQrHref}
                                  alt="Student Paytm QR"
                                  className="border-outline-variant/20 max-h-40 rounded-md border"
                                />
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-secondary text-xs">
                            No QR on file — use the bank transfer details
                            above.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-secondary text-sm">
                        The student has not added bank details or QR codes yet.
                        After you pay them by another channel, you can still
                        upload payment proof below.
                      </p>
                    )}
                  </div>

                  <DeanMarkPaidForm projectId={row.project_id} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-primary mb-2 text-xl font-bold">Past payments</h2>
        <p className="text-secondary mb-6 text-sm">
          Completed disbursements and receipts on file
        </p>
        <Card className="border-outline-variant/10">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent>
            {pastWithReceiptLinks.length === 0 ? (
              <p className="text-secondary text-sm">No paid disbursements yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Recorded</TableHead>
                    <TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastWithReceiptLinks.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-semibold">{row.title}</TableCell>
                      <TableCell>
                        {formatMoney(Number(row.approved_amount))}
                      </TableCell>
                      <TableCell>{formatDate(row.created_at)}</TableCell>
                      <TableCell>
                        {row.receiptHref ? (
                          <a
                            href={row.receiptHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
                          >
                            View
                            <ExternalLink className="size-3.5" aria-hidden />
                          </a>
                        ) : (
                          <span className="text-secondary text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
