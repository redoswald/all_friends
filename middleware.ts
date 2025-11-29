import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "prm_session";

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");

  // Redirect to login if not authenticated and trying to access protected route
  if (!sessionId && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect to home if authenticated and trying to access auth routes
  if (sessionId && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (they handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
