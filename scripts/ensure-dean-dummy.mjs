/**
 * Creates a dean Auth user + public.users row (via DB trigger).
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage: npm run seed:dean
 * Override: DEAN_DUMMY_EMAIL, DEAN_DUMMY_PASSWORD
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env",
  );
  process.exit(1);
}

const email =
  process.env.DEAN_DUMMY_EMAIL?.trim() ?? "dean-dummy@example.local";
const password =
  process.env.DEAN_DUMMY_PASSWORD?.trim() ?? "DeanDummy123!";
const name = process.env.DEAN_DUMMY_NAME?.trim() ?? "Dummy Dean";

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: page, error: listErr } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});
if (listErr) {
  console.error("listUsers:", listErr.message);
  process.exit(1);
}

const existing = page.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (existing) {
  console.log("Dean dummy already exists:");
  console.log("  Email:   ", email);
  console.log("  User id: ", existing.id);
  console.log("  (Password unchanged — use password reset if you forgot it.)");
  process.exit(0);
}

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name, role: "dean" },
});

if (error) {
  console.error("createUser:", error.message);
  process.exit(1);
}

console.log("Created dean dummy account:");
console.log("  Email:   ", email);
console.log("  Password:", password);
console.log("  User id: ", data.user?.id);
console.log("Sign in at /login with these credentials.");
