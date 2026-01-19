import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // allow internal Next.js assets and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("session");

  // routes that do NOT require authentication
  const publicRoutes = ["/login", "/forgot-password", "/reset-password"];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // not logged in = redirect to login unless route is public
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // logged in = prevent access to login page
  if (session && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
