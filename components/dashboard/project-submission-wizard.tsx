"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitProjectApplication } from "@/lib/actions/project-submission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";

const STEPS = [
  "Student information",
  "Team members",
  "Project details",
  "Faculty involved",
  "Budget & payments",
  "Confirmation",
] as const;

type TeamRow = {
  fullName: string;
  rollNumber: string;
  course: string;
  semester: string;
};

type FacultyRow = { fullName: string; contribution: string };

function emptyTeam(): TeamRow {
  return { fullName: "", rollNumber: "", course: "", semester: "" };
}

function emptyFaculty(): FacultyRow {
  return { fullName: "", contribution: "" };
}

type Props = { defaultLeadName: string };

export function ProjectSubmissionWizard({ defaultLeadName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [leadFullName, setLeadFullName] = useState(defaultLeadName);
  const [leadRoll, setLeadRoll] = useState("");
  const [leadCourse, setLeadCourse] = useState("");
  const [leadSemester, setLeadSemester] = useState("");

  const [team, setTeam] = useState<TeamRow[]>([]);

  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [progressSummary, setProgressSummary] = useState("");
  const [mvpTimeline, setMvpTimeline] = useState("");
  const [ppt, setPpt] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);

  const [faculty, setFaculty] = useState<FacultyRow[]>([]);

  const [fundsRequested, setFundsRequested] = useState("");
  const [budgetDoc, setBudgetDoc] = useState<File | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [holderName, setHolderName] = useState("");
  const [bankQr, setBankQr] = useState<File | null>(null);
  const [paytmQr, setPaytmQr] = useState<File | null>(null);

  function validateStep(s: number): string | null {
    switch (s) {
      case 0:
        if (!leadFullName.trim()) return "Name is required";
        if (!leadRoll.trim()) return "Roll number is required";
        if (!leadCourse.trim()) return "Course is required";
        if (!leadSemester.trim()) return "Semester is required";
        return null;
      case 1:
        return null;
      case 2:
        if (!title.trim()) return "Project name is required";
        if (!progressSummary.trim()) return "Progress so far is required";
        if (!mvpTimeline.trim()) return "MVP completion timeline is required";
        return null;
      case 3:
        return null;
      case 4:
        if (!fundsRequested.trim() || Number(fundsRequested) < 0)
          return "Valid funds requested is required";
        if (!accountNumber.trim() || !ifsc.trim() || !holderName.trim())
          return "Bank account number, IFSC, and account holder name are required";
        return null;
      default:
        return null;
    }
  }

  function next() {
    const v = validateStep(step);
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setStep((x) => Math.min(x + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((x) => Math.max(x - 1, 0));
  }

  async function onConfirmSubmit() {
    const v = validateStep(2) ?? validateStep(4);
    if (v) {
      setError(v);
      return;
    }
    setError(null);
    setPending(true);

    const teamPayload = team
      .filter((r) => r.fullName.trim())
      .map((r) => ({
        fullName: r.fullName.trim(),
        rollNumber: r.rollNumber.trim(),
        course: r.course.trim(),
        semester: r.semester.trim(),
      }));

    const facultyPayload = faculty
      .filter((r) => r.fullName.trim())
      .map((r) => ({
        fullName: r.fullName.trim(),
        contribution: r.contribution.trim(),
      }));

    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("domain", domain.trim());
    fd.set("description", description.trim());
    fd.set("lead_full_name", leadFullName.trim());
    fd.set("lead_roll_number", leadRoll.trim());
    fd.set("lead_course", leadCourse.trim());
    fd.set("lead_semester", leadSemester.trim());
    fd.set("progress_summary", progressSummary.trim());
    fd.set("mvp_timeline", mvpTimeline.trim());
    fd.set("funds_requested", fundsRequested.trim());
    fd.set("account_number", accountNumber.trim());
    fd.set("ifsc", ifsc.trim());
    fd.set("holder_name", holderName.trim());
    fd.set("team_students_json", JSON.stringify(teamPayload));
    fd.set("external_faculty_json", JSON.stringify(facultyPayload));
    if (ppt) fd.append("ppt", ppt);
    if (budgetDoc) fd.append("budget_doc", budgetDoc);
    if (bankQr) fd.append("bank_qr", bankQr);
    if (paytmQr) fd.append("paytm_qr", paytmQr);
    for (const img of images) {
      fd.append("images", img);
    }

    const res = await submitProjectApplication(fd);
    setPending(false);
    if (res.ok) {
      router.push(`/dashboard/student?project=${res.projectId}`);
      router.refresh();
    } else {
      setError(res.message);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => {
              if (i < step) {
                setError(null);
                setStep(i);
              }
            }}
            className={
              i === step
                ? "bg-primary text-on-primary rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase"
                : i < step
                  ? "text-secondary hover:text-primary rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase underline-offset-4 hover:underline"
                  : "text-outline-variant rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase"
            }
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {error ? (
        <Alert variant="default">
          <AlertCircle className="text-error size-4 shrink-0" aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="border-outline-variant/15">
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            Step {step + 1} of {STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lead_name">Full name</Label>
                <Input
                  id="lead_name"
                  value={leadFullName}
                  onChange={(e) => setLeadFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll">Roll number</Label>
                <Input
                  id="roll"
                  value={leadRoll}
                  onChange={(e) => setLeadRoll(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course">Course</Label>
                <Input
                  id="course"
                  value={leadCourse}
                  onChange={(e) => setLeadCourse(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Input
                  id="semester"
                  value={leadSemester}
                  onChange={(e) => setLeadSemester(e.target.value)}
                  placeholder="e.g. 6th semester, Fall 2025"
                  required
                />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-secondary text-sm">
                Add other students on the project team (optional). Leave empty if
                you are the sole member.
              </p>
              {team.map((row, idx) => (
                <div
                  key={idx}
                  className="border-outline-variant/20 space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-primary text-xs font-bold tracking-widest uppercase">
                      Student {idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-error gap-1"
                      onClick={() =>
                        setTeam((t) => t.filter((_, j) => j !== idx))
                      }
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Name</Label>
                      <Input
                        value={row.fullName}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTeam((t) =>
                            t.map((r, j) =>
                              j === idx ? { ...r, fullName: v } : r,
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Roll number</Label>
                      <Input
                        value={row.rollNumber}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTeam((t) =>
                            t.map((r, j) =>
                              j === idx ? { ...r, rollNumber: v } : r,
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Input
                        value={row.course}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTeam((t) =>
                            t.map((r, j) =>
                              j === idx ? { ...r, course: v } : r,
                            ),
                          );
                        }}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Semester</Label>
                      <Input
                        value={row.semester}
                        onChange={(e) => {
                          const v = e.target.value;
                          setTeam((t) =>
                            t.map((r, j) =>
                              j === idx ? { ...r, semester: v } : r,
                            ),
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setTeam((t) => [...t, emptyTeam()])}
              >
                <Plus className="size-4" aria-hidden />
                Add student
              </Button>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ptitle">Project name</Label>
                <Input
                  id="ptitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdomain">Domain</Label>
                <Input
                  id="pdomain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="e.g. Web, IoT, AI"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdesc">Short description (optional)</Label>
                <Textarea
                  id="pdesc"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ppt">Presentation (PPT / PDF)</Label>
                <Input
                  id="ppt"
                  type="file"
                  accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  className="border-outline-variant/30 bg-surface-container-lowest py-2"
                  onChange={(e) =>
                    setPpt(e.target.files?.[0] ?? null)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prog">Progress till now</Label>
                <Textarea
                  id="prog"
                  rows={4}
                  value={progressSummary}
                  onChange={(e) => setProgressSummary(e.target.value)}
                  required
                  placeholder="What is done so far?"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mvp">Time needed to complete the MVP</Label>
                <Textarea
                  id="mvp"
                  rows={2}
                  value={mvpTimeline}
                  onChange={(e) => setMvpTimeline(e.target.value)}
                  required
                  placeholder="e.g. 8 weeks part-time, 2 months full-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pimgs">Project images (optional)</Label>
                <Input
                  id="pimgs"
                  type="file"
                  accept="image/*"
                  multiple
                  className="border-outline-variant/30 bg-surface-container-lowest py-2"
                  onChange={(e) =>
                    setImages(e.target.files ? Array.from(e.target.files) : [])
                  }
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <p className="text-secondary text-sm">
                External or informal faculty involvement (optional). Official
                assigned faculty is still set by the dean when the project is
                approved.
              </p>
              {faculty.map((row, idx) => (
                <div
                  key={idx}
                  className="border-outline-variant/20 space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-primary text-xs font-bold tracking-widest uppercase">
                      Faculty {idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-error gap-1"
                      onClick={() =>
                        setFaculty((t) => t.filter((_, j) => j !== idx))
                      }
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Remove
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={row.fullName}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFaculty((t) =>
                          t.map((r, j) =>
                            j === idx ? { ...r, fullName: v } : r,
                          ),
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contribution</Label>
                    <Textarea
                      rows={2}
                      value={row.contribution}
                      onChange={(e) => {
                        const v = e.target.value;
                        setFaculty((t) =>
                          t.map((r, j) =>
                            j === idx ? { ...r, contribution: v } : r,
                          ),
                        );
                      }}
                      placeholder="How they support the project"
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setFaculty((t) => [...t, emptyFaculty()])}
              >
                <Plus className="size-4" aria-hidden />
                Add faculty
              </Button>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="funds">Funds requested (INR)</Label>
                <Input
                  id="funds"
                  type="number"
                  min={0}
                  step="0.01"
                  value={fundsRequested}
                  onChange={(e) => setFundsRequested(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bdoc">Budget / usage document (optional)</Label>
                <Input
                  id="bdoc"
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  className="border-outline-variant/30 bg-surface-container-lowest py-2"
                  onChange={(e) =>
                    setBudgetDoc(e.target.files?.[0] ?? null)
                  }
                />
              </div>
              <div className="border-outline-variant/15 space-y-3 border-t pt-4">
                <p className="text-primary text-xs font-bold tracking-widest uppercase">
                  Student bank details
                </p>
                <div className="space-y-2">
                  <Label htmlFor="acc">Account number</Label>
                  <Input
                    id="acc"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifsc">IFSC</Label>
                  <Input
                    id="ifsc"
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holder">Account holder name</Label>
                  <Input
                    id="holder"
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bqr">Bank / UPI QR (optional)</Label>
                  <Input
                    id="bqr"
                    type="file"
                    accept="image/*"
                    className="border-outline-variant/30 bg-surface-container-lowest py-2"
                    onChange={(e) =>
                      setBankQr(e.target.files?.[0] ?? null)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pqr">Paytm / other wallet QR (optional)</Label>
                  <Input
                    id="pqr"
                    type="file"
                    accept="image/*"
                    className="border-outline-variant/30 bg-surface-container-lowest py-2"
                    onChange={(e) =>
                      setPaytmQr(e.target.files?.[0] ?? null)
                    }
                  />
                </div>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="text-secondary space-y-4 text-sm">
              <p className="text-primary font-semibold">
                Review your application before submitting to the dean queue.
              </p>
              <ul className="space-y-3 leading-relaxed">
                <li>
                  <span className="text-primary font-bold">Lead student:</span>{" "}
                  {leadFullName} — {leadRoll}, {leadCourse}, {leadSemester}
                </li>
                <li>
                  <span className="text-primary font-bold">Team:</span>{" "}
                  {team.filter((r) => r.fullName.trim()).length
                    ? team
                        .filter((r) => r.fullName.trim())
                        .map((r) => r.fullName)
                        .join(", ")
                    : "Just you"}
                </li>
                <li>
                  <span className="text-primary font-bold">Project:</span>{" "}
                  {title}
                  {domain ? ` · ${domain}` : ""}
                </li>
                <li>
                  <span className="text-primary font-bold">Files:</span> PPT{" "}
                  {ppt ? ppt.name : "—"}, images {images.length}, budget doc{" "}
                  {budgetDoc ? budgetDoc.name : "—"}
                </li>
                <li>
                  <span className="text-primary font-bold">MVP:</span>{" "}
                  {mvpTimeline.slice(0, 120)}
                  {mvpTimeline.length > 120 ? "…" : ""}
                </li>
                <li>
                  <span className="text-primary font-bold">Funds requested:</span>{" "}
                  {fundsRequested.trim()
                    ? `${fundsRequested.trim()} INR`
                    : "—"}
                </li>
                <li>
                  <span className="text-primary font-bold">Bank:</span>{" "}
                  {holderName}
                  {accountNumber.length >= 4
                    ? ` · ****${accountNumber.slice(-4)}`
                    : ""}
                </li>
                <li>
                  <span className="text-primary font-bold">Faculty noted:</span>{" "}
                  {faculty.filter((r) => r.fullName.trim()).length
                    ? faculty
                        .filter((r) => r.fullName.trim())
                        .map((r) => `${r.fullName} (${r.contribution || "—"})`)
                        .join("; ")
                    : "None"}
                </li>
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={back}
              disabled={step === 0 || pending}
              className="gap-1"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next} className="gap-1">
                Next
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onConfirmSubmit}
                disabled={pending}
              >
                {pending ? "Submitting…" : "Submit application"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
