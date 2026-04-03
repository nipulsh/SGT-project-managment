import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

function isProtectedDashboardPath(path: string) {
  if (path === "/dashboard") return true;
  return (
    path.startsWith("/dashboard/student") ||
    path.startsWith("/dashboard/faculty") ||
    path.startsWith("/dashboard/dean")
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const metaRole = user?.user_metadata?.role as string | undefined;
  const role =
    metaRole === "student" || metaRole === "faculty" || metaRole === "dean"
      ? metaRole
      : undefined;

  if (isProtectedDashboardPath(path) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  /* OAuth users may lack role in JWT until metadata sync; resolve via /dashboard + DB */
  if (
    user &&
    !role &&
    isProtectedDashboardPath(path) &&
    path !== "/dashboard"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (user && role) {
    const home = `/dashboard/${role}`;
    if (path.startsWith("/dashboard/student") && role !== "student") {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }
    if (path.startsWith("/dashboard/faculty") && role !== "faculty") {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }
    if (path.startsWith("/dashboard/dean") && role !== "dean") {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
