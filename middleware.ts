import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "prm_session";

export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const isPublicRoute = pathname === "/";
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");

  // Allow public routes without authentication
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated and trying to access protected route
  if (!sessionId && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if authenticated and trying to access auth routes
  if (sessionId && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
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
