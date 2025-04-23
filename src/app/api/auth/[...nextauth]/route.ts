import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        try {
          // Use the real backend API URL
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
          console.log('Auth API using URL:', API_URL);
          const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              identifier: credentials.identifier,
              password: credentials.password,
            }),
            credentials: 'include', // This is important to include cookies
          });

          // Log the cookies from the response
          const cookies = response.headers.get('set-cookie');
          console.log('Cookies from login response:', cookies);

          // Extract the access token from the cookies
          let cookieAccessToken = '';
          if (cookies) {
            const accessTokenMatch = cookies.match(/accesstoken=([^;]+)/);
            if (accessTokenMatch && accessTokenMatch[1]) {
              cookieAccessToken = accessTokenMatch[1];
              console.log('Extracted access token from cookies:', cookieAccessToken);
            }
          }

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.message || "Authentication failed");
          }

          // Extract tokens from the response
          // The backend sets tokens in cookies, but also might return them in the response
          // We'll use whatever is available
          // The backend sets the token in cookies, but we need to store it in the session
          // for frontend use. We'll use a placeholder token that will be sent in the
          // Authorization header for API requests
          const accessToken = data.token || data.tokens?.accessToken || cookieAccessToken || 'cookie-auth-token';
          console.log('Using access token:', accessToken);
          const refreshToken = data.refreshToken || data.tokens?.refreshToken || '';

          // The login response only includes the user ID
          // We need to make a separate API call to get the user's profiles
          // For now, we'll just return the user ID and let the profile selection page
          // handle fetching the profiles

          // The login response only includes the user ID, not the full user object
          // We need to make a separate API call to get the user's complete details including role
          const userId = data.user._id || data.user.id;
          let profileId = ''; // Using let so we can update it
          let profileToken = ''; // Using let so we can update it

          // Fetch complete user data including role from /me endpoint
          console.log('Fetching complete user data from /me endpoint...');
          const userResponse = await fetch(`${API_URL}/users/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });

          let fullUserData = null;
          let userRole = null;
          let isUserAdmin = false;

          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('User data from /me:', userData);

            if (userData.success && userData.user) {
              fullUserData = userData.user;
              userRole = userData.user.role;
              isUserAdmin = userRole === 'admin';

              // Don't automatically select a profile, let the user choose
              // We'll only set profileId and profileToken if the user has exactly one profile
              if (userData.user.profiles && userData.user.profiles.length === 1) {
                profileId = userData.user.profiles[0]._id;
                profileToken = userData.user.profiles[0].accessToken || '';
              }
            }
          } else {
            console.warn('Failed to fetch complete user data:', await userResponse.text());
          }

          // After successful authentication, we need to make a separate call to get profile details
          // In a real implementation, we would do that here
          console.log('===== AUTH RESPONSE DATA =====');
          console.log('User authenticated successfully, user ID:', data.user._id || data.user.id);
          console.log('Full user object:', JSON.stringify(data.user, null, 2));
          console.log('User role from response:', data.user.role);
          console.log('Is user admin?', data.user.role === 'admin');
          console.log('User has profiles:', data.user.profiles);
          console.log('Access token:', accessToken ? 'Present' : 'Missing');
          console.log('===== END AUTH RESPONSE =====');

          // Check if the user has multiple profiles
          const hasMultipleProfiles = fullUserData?.profiles && fullUserData.profiles.length > 1;

          // Force log the returned user object
          const userToReturn = {
            id: data.user._id || data.user.id,
            name: data.user.fullName || data.user.name || 'User',
            email: data.user.email || credentials.identifier,
            image: data.user.avatar || null,
            role: data.user.role || 'user',
            isAdmin: data.user.role === 'admin',
            token: accessToken,
            refreshToken: refreshToken,
            profileId: profileId,
            profileToken: profileToken,
            hasMultipleProfiles: hasMultipleProfiles
          };

          console.log('===== RETURNING USER OBJECT =====');
          console.log(JSON.stringify(userToReturn, null, 2));
          console.log('===== END RETURNING USER OBJECT =====');

          // Log the number of profiles
          console.log('User profiles count:', fullUserData?.profiles?.length || 0);

          // Return the user object with tokens and complete data
          return {
            id: userId,
            name: fullUserData?.fullName || 'User',
            email: fullUserData?.email || credentials.identifier,
            image: fullUserData?.profileImage || null,
            role: userRole || 'user', // Use role from /me endpoint
            isAdmin: isUserAdmin,
            token: accessToken,
            refreshToken: refreshToken,
            profileId: profileId,
            profileToken: profileToken,
            hasMultipleProfiles: hasMultipleProfiles
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
        // Add role to the token
        token.role = user.role || (user.isAdmin ? 'admin' : 'user');
        token.accessToken = user.token;
        token.profileId = user.profileId;
        token.profileToken = user.profileToken;

        // Set the hasMultipleProfiles flag from the user object
        token.hasMultipleProfiles = user.hasMultipleProfiles || false;
        console.log('Setting hasMultipleProfiles in JWT:', token.hasMultipleProfiles);
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        // Add role to the user object in session
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
        session.profileId = token.profileId as string;
        session.profileToken = token.profileToken as string;
        // Add hasMultipleProfiles to the session
        (session.user as any).hasMultipleProfiles = token.hasMultipleProfiles as boolean;
        console.log('Setting hasMultipleProfiles in session:', (session.user as any).hasMultipleProfiles);

        // Log the session for debugging
        console.log('NextAuth session callback:', {
          userId: session.user.id,
          profileId: session.profileId,
          hasProfileToken: !!session.profileToken,
          isAdmin: session.user.isAdmin,
          role: session.user.role,
          hasMultipleProfiles: (session.user as any).hasMultipleProfiles
        });
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
