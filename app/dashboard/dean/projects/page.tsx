import Link from "next/link";
import { ProjectStatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchDeanDirectory } from "@/lib/dean/queries";
import { formatDate } from "@/lib/format";

export default async function DeanProjectsDirectoryPage() {
  const directory = await fetchDeanDirectory();

  return (
    <div className="w-full p-6 md:p-8 lg:p-10">
      <section className="w-full">
        <h1 className="text-primary mb-2 text-2xl font-bold md:text-3xl">
          Project directory
        </h1>
        <p className="text-secondary mb-6 text-sm">
          All projects and their current status
        </p>
        <Card className="border-outline-variant/10 w-full">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directory.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold">{p.title}</TableCell>
                    <TableCell>
                      <ProjectStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>{p.domain ?? "—"}</TableCell>
                    <TableCell>{formatDate(p.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/dean/projects/${p.id}`}>
                            View details
                          </Link>
                        </Button>
                        {p.paymentIncomplete ? (
                          <Button size="sm" asChild>
                            <Link
                              href={`/dashboard/dean/payments?complete=${encodeURIComponent(p.id)}`}
                            >
                              Submit payment proof
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
