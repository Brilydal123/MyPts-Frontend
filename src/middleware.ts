import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/error"];
const authRequiredButPublicRoutes = ["/complete-profile"]; // Routes that require auth but shouldn't redirect to dashboard

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

  // Get token from cookies
  const cookieToken = request.cookies.get("accessToken")?.value ||
                     request.cookies.get("accesstoken")?.value;

  // Get token from headers (for API requests)
  const headerToken = request.headers.get("Authorization")?.replace("Bearer ", "") ||
                     request.headers.get("x-access-token");

  // If we have logout indicators, don't consider tokens valid
  const customToken = !hasLogoutIndicator ? (cookieToken || headerToken) : null;

  // Special handling for Google auth callback and complete-profile
  const isGoogleCallback = pathname.includes("/auth/google/callback");
  const isCompleteProfile = pathname === "/complete-profile";

  // Consider the user authenticated if:
  // 1. They have a valid NextAuth token, OR
  // 2. They have a custom token AND (it's been verified by the client OR it's a special path)
  const isAuthenticated = !!token ||
                         (!!customToken && (isVerifiedByClient || isGoogleCallback || isCompleteProfile));

  // Log authentication status for debugging
  console.log("Auth check (middleware):", {
    path: pathname,
    hasNextAuthToken: !!token,
    hasCookieToken: !!cookieToken,
    hasHeaderToken: !!headerToken,
    hasCustomToken: !!customToken,
    isVerifiedByClient,
    isGoogleCallback,
    isCompleteProfile,
    hasLogoutIndicator,
    isAuthenticated,
    isLogoutRequest
  });

  // Special handling for complete-profile page
  if (pathname === "/complete-profile") {
    // Allow access to complete-profile if authenticated, otherwise redirect to login
    if (!isAuthenticated && !isLogoutRequest && !hasLogoutIndicator) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

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
    "/complete-profile",
    "/auth/google/callback",
    "/api/auth/update-profile",
  ],
};
