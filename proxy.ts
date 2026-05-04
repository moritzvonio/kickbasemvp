import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/leagues", "/league", "/account", "/upgrade"];
const SESSION_COOKIE = "bb_session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!needsAuth) return NextResponse.next();

  const session = req.cookies.get(SESSION_COOKIE);
  if (!session?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/leagues/:path*", "/league/:path*", "/account/:path*", "/upgrade/:path*"],
};
