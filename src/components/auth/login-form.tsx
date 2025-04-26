'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  identifier: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const error = searchParams?.get('error') || null;
  const callbackUrl = searchParams?.get('callbackUrl') || '/select-profile';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        identifier: values.identifier,
        password: values.password,
        redirect: false,
      });

      console.log('SignIn result:', result);

      if (result?.error) {
        toast.error('Login failed', {
          description: result.error,
        });
      } else {
        // Get the session to extract the access token
        try {
          const response = await fetch('/api/auth/session');
          const session = await response.json();
          console.log('Session after login:', session);

          // Store the access token in localStorage
          if (session?.accessToken) {
            localStorage.setItem('accessToken', session.accessToken);
            console.log('Access token stored in localStorage');
          }
        } catch (sessionError) {
          console.error('Error getting session:', sessionError);
        }

        toast.success('Login successful', {
          description: 'Redirecting to profile selection...',
        });
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed', {
        description: 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center">
          <Coins className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Sign in to MyPts Manager</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <p>Authentication failed. Please check your credentials.</p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-center">
        <div className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
