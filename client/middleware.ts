import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("session");

  const isLoginRoute = request.nextUrl.pathname.startsWith("/login");

  // not logged in = redirect to login
  if (!session && !isLoginRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // logged in = prevent viewing login page again
  if (session && isLoginRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login).*)",
  ],
};
