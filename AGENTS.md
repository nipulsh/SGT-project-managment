<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Learned User Preferences

- Align UI with `designs/` (layout, typography, patterns) and shadcn/ui; avoid unrelated ad-hoc UI.
- Use lucide-react for icons.
- Google OAuth should only create or assign the student role.
- Preferred stack for this app: Supabase (auth, database, storage), Prisma where integrated, shadcn/ui, Tailwind CSS.
- User-facing domain language should emphasize **projects**, not “research,” unless a specific context requires otherwise.

## Learned Workspace Facts

- Repository targets a University Project Management Platform.
- Prisma datasource may need the `auth` schema in `schemas` because `public.users` references `auth.users`.
- SQL migrations live under `supabase/migrations/` and are applied via the project `db:migrate` script.
- Supabase Storage uses private buckets `bills`, `qr-codes`, `receipts`, and `project-files` (see migrations and `lib/storage.ts`).
- Dean dashboard areas are split across routes: `/dashboard/dean` (overview), `/dashboard/dean/approvals`, `/dashboard/dean/payments`, `/dashboard/dean/projects`.
