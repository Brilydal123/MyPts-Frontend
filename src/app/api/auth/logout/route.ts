import { NextResponse } from 'next/server';

export async function GET() {
  // Create a response with cleared cookies
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  );

  // Specifically target NextAuth.js cookies with different security prefixes
  [
    'next-auth.session-token',
    'next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.session-token',
    '__Secure-next-auth.callback-url',
    '__Secure-next-auth.csrf-token',
    '__Host-next-auth.csrf-token',
  ].forEach((name) => {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/'
    });
  });

  // Specifically target our custom cookies
  ['accesstoken', 'refreshtoken'].forEach((name) => {
    response.cookies.set(name, '', {
      expires: new Date(0),
      path: '/'
    });
  });

  // Also try with different domains and paths
  const domains = [undefined, 'localhost', '.localhost'];
  const paths = ['/', '/api', ''];

  // Try different combinations for the most important cookies
  domains.forEach(domain => {
    paths.forEach(path => {
      response.cookies.set('next-auth.session-token', '', {
        expires: new Date(0),
        path,
        ...(domain ? { domain } : {})
      });

      response.cookies.set('accesstoken', '', {
        expires: new Date(0),
        path,
        ...(domain ? { domain } : {})
      });

      response.cookies.set('refreshtoken', '', {
        expires: new Date(0),
        path,
        ...(domain ? { domain } : {})
      });
    });
  });

  return response;
}

export async function POST() {
  return GET();
}
