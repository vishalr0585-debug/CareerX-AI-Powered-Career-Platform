import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedPaths = ["/dashboard"];

// Routes that should redirect to dashboard if already authenticated
const authPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken =
    request.cookies.get("accessToken")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  // Also check localStorage-synced cookie (set by client)
  const hasClientToken = request.cookies.get("has_token")?.value === "1";
  const isAuthenticated = !!accessToken || hasClientToken;

  // Protected routes — redirect to login if not authenticated
  if (protectedPaths.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auth routes — redirect to dashboard if already authenticated
  if (authPaths.some((p) => pathname === p)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/forgot-password", "/reset-password"],
};
