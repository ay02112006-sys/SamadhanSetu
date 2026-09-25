// src/middleware.ts
// Uses next-auth/middleware which is Edge Runtime compatible.
// Reads the JWT token directly — no Node.js-only imports.
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request) {
    const pathname = request.nextUrl.pathname;
    const token = request.nextauth.token;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const role = (token.role as string | undefined) ?? "";

    // Root dashboard → redirect to role-specific dashboard
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      return NextResponse.redirect(
        new URL(`/dashboard/${role.toLowerCase()}`, request.url)
      );
    }

    // Enforce role-specific path: /dashboard/citizen must match role CITIZEN
    const segments = pathname.split("/");
    const roleSegment = segments[2]; // e.g., "citizen", "university"
    if (roleSegment && roleSegment !== role.toLowerCase()) {
      return NextResponse.redirect(
        new URL(`/dashboard/${role.toLowerCase()}`, request.url)
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only run middleware logic when user is logged in
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
};
