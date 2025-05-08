import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/error"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for social auth callbacks and API routes
  if (pathname.startsWith("/auth/google/callback") || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check for logout flag or cache-busting parameter in URL
  const url = new URL(request.url);
  const isLogoutRequest = url.searchParams.get("logout") === "true";
  const hasCacheBuster = url.searchParams.has("t") || url.searchParams.has("nocache");

  // If this is a logout request or has cache buster, don't check authentication
  if ((isLogoutRequest || hasCacheBuster) && pathname === "/login") {
    // Clear any cookies in the response
    const response = NextResponse.next();

    // Clear auth cookies in the response
    const cookiesToClear = [
      "accessToken", "accesstoken", "refreshToken", "refreshtoken",
      "next-auth.session-token", "__Secure-next-auth.session-token",
      "profileId", "profileToken", "selectedProfileId", "selectedProfileToken"
    ];

    cookiesToClear.forEach(name => {
      response.cookies.set(name, "", {
        expires: new Date(0),
        path: "/"
      });
    });

    return response;
  }

  // Get NextAuth token (this validates the token)
  const token = await getToken({ req: request });

  // For custom tokens, we need to check if they're still valid
  // We'll use a header to indicate if the client has verified the token
  const isVerifiedByClient = request.headers.get("x-token-verified") === "true";

  // Check for cache busting parameters that indicate a fresh page load after logout
  const hasLogoutIndicator = url.searchParams.has("logout") ||
                            url.searchParams.has("t") ||
                            url.searchParams.has("nocache");

  // If we have logout indicators, don't consider custom tokens valid
  const customToken = !hasLogoutIndicator ? (
    request.cookies.get("accessToken")?.value ||
    request.cookies.get("accesstoken")?.value
  ) : null;

  // Only consider the user authenticated if:
  // 1. They have a valid NextAuth token, OR
  // 2. They have a custom token AND it's been verified by the client
  const isAuthenticated = !!token || (!!customToken && isVerifiedByClient);

  // Log authentication status for debugging
  console.log("Auth check (middleware):", {
    path: pathname,
    hasNextAuthToken: !!token,
    hasCustomToken: !!customToken,
    isVerifiedByClient,
    hasLogoutIndicator,
    isAuthenticated,
    isLogoutRequest
  });

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && publicRoutes.includes(pathname) && !isLogoutRequest && !hasLogoutIndicator) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Let the client handle other auth redirects
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/buy/:path*",
    "/sell/:path*",
    "/donate/:path*",
    "/transactions/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
