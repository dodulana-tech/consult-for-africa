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

// A client project page whose link gets typed into phones and pasted out of
// WhatsApp. Route paths are case sensitive, so the near-misses need catching,
// and it has to be done here rather than in next.config: redirect `source`
// matching is case insensitive there, which sends the canonical path to itself.
const CASE_FORGIVING = new Map<string, string>([["/osteonproject", "/OsteonProject"]]);

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;

  const canonical = CASE_FORGIVING.get(nextUrl.pathname.toLowerCase().replace(/-/g, ""));
  if (canonical && nextUrl.pathname !== canonical) {
    return NextResponse.redirect(new URL(canonical, nextUrl));
  }

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
