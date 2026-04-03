import { ProjectStatusBadge } from "@/components/dashboard/status-badge";
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
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <section>
        <h1 className="text-primary mb-2 text-2xl font-bold md:text-3xl">
          Project directory
        </h1>
        <p className="text-secondary mb-6 text-sm">
          All projects and their current status
        </p>
        <Card className="border-outline-variant/10">
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Created</TableHead>
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
