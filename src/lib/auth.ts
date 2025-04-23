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

          const accessToken = data.token || data.tokens?.accessToken || cookieAccessToken || 'cookie-auth-token';
          console.log('Using access token:', accessToken);
          const refreshToken = data.refreshToken || data.tokens?.refreshToken || '';

          const userId = data.user._id || data.user.id;
          let profileId = '';
          let profileToken = '';

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

              if (userData.user.profiles && userData.user.profiles.length === 1) {
                profileId = userData.user.profiles[0]._id;
                profileToken = userData.user.profiles[0].accessToken || '';
              }
            }
          } else {
            console.warn('Failed to fetch complete user data:', await userResponse.text());
          }

          console.log('===== AUTH RESPONSE DATA =====');
          console.log('User authenticated successfully, user ID:', data.user._id || data.user.id);
          console.log('Full user object:', JSON.stringify(data.user, null, 2));
          console.log('User role from response:', data.user.role);
          console.log('Is user admin?', data.user.role === 'admin');
          console.log('User has profiles:', data.user.profiles);
          console.log('Access token:', accessToken ? 'Present' : 'Missing');
          console.log('===== END AUTH RESPONSE =====');

          const hasMultipleProfiles = fullUserData?.profiles && fullUserData.profiles.length > 1;

          console.log('===== RETURNING USER OBJECT =====');
          console.log('User profiles count:', fullUserData?.profiles?.length || 0);

          return {
            id: userId,
            name: fullUserData?.fullName || 'User',
            email: fullUserData?.email || credentials.identifier,
            image: fullUserData?.profileImage || null,
            role: userRole || 'user',
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
        token.role = user.role || (user.isAdmin ? 'admin' : 'user');
        token.accessToken = user.token;
        token.profileId = user.profileId;
        token.profileToken = user.profileToken;
        token.hasMultipleProfiles = user.hasMultipleProfiles || false;
        console.log('Setting hasMultipleProfiles in JWT:', token.hasMultipleProfiles);
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
        session.profileId = token.profileId as string;
        session.profileToken = token.profileToken as string;
        (session.user as any).hasMultipleProfiles = token.hasMultipleProfiles as boolean;
        console.log('Setting hasMultipleProfiles in session:', (session.user as any).hasMultipleProfiles);

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
