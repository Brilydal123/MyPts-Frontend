import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/auth/error"];
const authRequiredButPublicRoutes = ["/complete-profile"]; // Routes that require auth but shouldn't redirect to dashboard

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const url = new URL(request.url);

  // Special handling for Google Auth Callback
  if (pathname.startsWith("/auth/google/callback")) {
    // For Google Auth Callback, we'll check for admin role in the URL parameters
    const token = url.searchParams.get("token");

    if (token) {
      try {
        // Try to decode the token to check for admin role
        // This is a simple check and doesn't validate the signature
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));

          // If the token contains userId, we can try to check for admin cookies
          if (payload.userId) {
            const cookieIsAdmin = request.cookies.get("isAdmin")?.value;
            const cookieUserRole = request.cookies.get("X-User-Role")?.value;

            if (cookieIsAdmin === 'true' || cookieUserRole === 'admin') {
              console.log("Admin user detected in Google Auth Callback, redirecting to admin dashboard");
              return NextResponse.redirect(new URL("/admin", request.url));
            }
          }
        }
      } catch (error) {
        console.error("Error decoding token in middleware:", error);
      }
    }

    // If not admin or error, continue with normal flow
    return NextResponse.next();
  }

  // Skip middleware for API routes
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check for logout flag or cache-busting parameter in URL
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

  // Check if user is admin - with detailed logging
  const tokenRole = token?.role;
  const tokenIsAdmin = token?.isAdmin;
  const cookieIsAdmin = request.cookies.get("isAdmin")?.value;
  const cookieUserRole = request.cookies.get("X-User-Role")?.value;
  const cookieUserIsAdmin = request.cookies.get("X-User-Is-Admin")?.value;

  const isAdmin = tokenRole === 'admin' ||
                 tokenIsAdmin === true ||
                 cookieIsAdmin === 'true' ||
                 cookieUserRole === 'admin' ||
                 cookieUserIsAdmin === 'true';

  console.log("ADMIN ROLE DEBUG (middleware):", {
    tokenRole,
    tokenIsAdmin,
    cookieIsAdmin,
    cookieUserRole,
    cookieUserIsAdmin,
    isAdmin,
    pathname,
    token: token ? {
      id: token.id,
      role: token.role,
      isAdmin: token.isAdmin,
      profileId: token.profileId
    } : null
  });

  // Special handling for select-profile page - redirect admin users directly to admin dashboard
  if (isAuthenticated && pathname === "/select-profile" && isAdmin) {
    console.log("Admin user detected in middleware, bypassing profile selection");
    return NextResponse.redirect(new URL("/admin", request.url));
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
