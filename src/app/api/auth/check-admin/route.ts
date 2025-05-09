'use server';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ isAdmin: false }, { status: 400 });
    }

    // Decode the token to get the user ID
    let userId = '';
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        userId = payload.userId;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
      return NextResponse.json({ isAdmin: false }, { status: 400 });
    }

    // Make a request to the backend to check if the user is an admin
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${apiUrl}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      return NextResponse.json({ isAdmin: false }, { status: response.status });
    }

    const data = await response.json();
    
    // Check if the user is an admin
    const isAdmin = data.user?.role === 'admin' || data.user?.isAdmin === true;
    
    console.log('Admin check result:', { userId, isAdmin, role: data.user?.role });

    // If the user is an admin, set cookies
    if (isAdmin) {
      const res = NextResponse.json({ isAdmin: true }, { status: 200 });
      
      // Set cookies for admin status
      res.cookies.set('isAdmin', 'true', {
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
      });
      
      res.cookies.set('X-User-Role', 'admin', {
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
      });
      
      return res;
    }

    return NextResponse.json({ isAdmin: false }, { status: 200 });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
