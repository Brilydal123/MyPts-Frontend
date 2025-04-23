import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Call your API to authenticate
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            return null;
          }

          // Return the user object with token
          return {
            id: data.user._id,
            name: data.user.fullName || data.user.username,
            email: data.user.email,
            image: data.user.profileImage,
            token: data.tokens.accessToken,
            isAdmin: data.user.role === 'admin' || data.user.role === 'superadmin',
            role: data.user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.accessToken = user.token;
        token.isAdmin = user.isAdmin;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      isAdmin: boolean;
      role: string;
    };
    accessToken: string;
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
    image: string;
    token: string;
    isAdmin: boolean;
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    accessToken: string;
    isAdmin: boolean;
    role: string;
  }
}
