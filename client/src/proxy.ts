import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow internal Next.js assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get("session");
  const isLogin = pathname.startsWith("/login");

  if (!session && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
