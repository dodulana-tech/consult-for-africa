import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PLATFORM_ROUTES = ["/dashboard", "/projects", "/deliverables", "/consultants", "/clients", "/timesheets", "/settings", "/proposals", "/ai", "/admin", "/founder", "/talent", "/meetings", "/communications", "/tasks", "/desk", "/brief", "/commitments", "/decisions", "/rhythm", "/inventory"];
// Roles whose day starts somewhere other than the dashboard.
const LANDING_BY_ROLE: Record<string, string> = {
  ACADEMY_LEARNER: "/academy",
  EXECUTIVE_ASSISTANT: "/desk",
  ADMINISTRATIVE_ASSISTANT: "/desk",
};
const AUTH_ROUTES = ["/login"];
const ONBOARDING_ROUTE = "/onboarding";
const ONBOARDING_COMPLETE_STATUSES = ["ACTIVE", "ASSESSMENT_COMPLETE", "REVIEW"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isPlatformRoute = PLATFORM_ROUTES.some((r) => nextUrl.pathname === r || nextUrl.pathname.startsWith(r + "/"));
  const isAuthRoute = AUTH_ROUTES.some((r) => nextUrl.pathname === r || nextUrl.pathname.startsWith(r + "/"));

  if (isPlatformRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    // Academy Learners land in Academy and the Office of the Founding Partner
    // lands on their task board. Neither has a dashboard to go to.
    const role = session?.user?.role ?? "";
    const dest = LANDING_BY_ROLE[role] ?? "/dashboard";
    return NextResponse.redirect(new URL(dest, nextUrl));
  }

  // Redirect consultants with incomplete onboarding to /onboarding
  if (isPlatformRoute && isLoggedIn && session?.user?.role === "CONSULTANT") {
    const status = session?.user?.onboardingStatus;
    if (status && !ONBOARDING_COMPLETE_STATUSES.includes(status)) {
      return NextResponse.redirect(new URL(ONBOARDING_ROUTE, nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|studio).*)"],
};
