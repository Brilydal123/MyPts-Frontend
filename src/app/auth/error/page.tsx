'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Coins } from 'lucide-react';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    // If no error is provided, redirect to login
    if (!error) {
      router.push('/login');
    }
  }, [error, router]);

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'Signin':
        return 'Try signing in with a different account.';
      case 'OAuthSignin':
        return 'Try signing in with a different provider.';
      case 'OAuthCallback':
        return 'Try signing in with a different provider.';
      case 'OAuthCreateAccount':
        return 'Try signing in with a different provider.';
      case 'EmailCreateAccount':
        return 'Try signing in with a different email address.';
      case 'Callback':
        return 'Try signing in with a different account.';
      case 'OAuthAccountNotLinked':
        return 'To confirm your identity, sign in with the same account you used originally.';
      case 'EmailSignin':
        return 'Check your email address.';
      case 'CredentialsSignin':
        return 'Sign in failed. Check the details you provided are correct.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center">
            <Coins className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>There was a problem signing you in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p>{error ? getErrorMessage(error) : 'An unexpected error occurred'}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link href="/login">Try Again</Link>
          </Button>
          <div className="text-sm text-muted-foreground text-center">
            <Link href="/" className="text-primary hover:underline">
              Return to Home
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
