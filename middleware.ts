import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PLATFORM_ROUTES = ["/dashboard", "/projects", "/deliverables", "/consultants", "/clients", "/timesheets", "/settings", "/proposals", "/ai", "/admin", "/founder", "/talent"];
const AUTH_ROUTES = ["/login"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const isPlatformRoute = PLATFORM_ROUTES.some((r) => nextUrl.pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => nextUrl.pathname.startsWith(r));

  if (isPlatformRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|studio).*)"],
};
