"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { AnimatedButton } from "@/components/ui/animated-button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  identifier: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const error = searchParams?.get("error") || null;
  const callbackUrl = searchParams?.get("callbackUrl") || "/select-profile";
  const isLogout = searchParams?.get("logout") === "true";

  useEffect(() => {
    if (isLogout) {
      toast.success("Logged out successfully");
    }
  }, [isLogout]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        identifier: values.identifier,
        password: values.password,
        redirect: false,
      });

      console.log("SignIn result:", result);

      if (result?.error) {
        toast.error("Login failed", {
          description: result.error,
        });
      } else {
        // Get the session to extract the access token
        try {
          const response = await fetch("/api/auth/session");
          const session = await response.json();
          console.log("Session after login:", session);

          // Store the access token in localStorage
          if (session?.accessToken) {
            localStorage.setItem("accessToken", session.accessToken);
            console.log("Access token stored in localStorage");

            // Also store the token in a cookie for better compatibility
            document.cookie = `accesstoken=${session.accessToken}; path=/; max-age=2592000`; // 30 days
            console.log("Access token also stored in cookie");
          }
        } catch (sessionError) {
          console.error("Error getting session:", sessionError);
        }

        toast.success("Login successful", {
          description: "Redirecting to profile selection...",
        });
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center">
          <Image
            src="/profileblack.png"
            alt="MyProfile"
            width={60}
            height={60}
            className="h-16 w-16 object-contain"
          />
        </div>
        <CardTitle className="text-2xl">Sign in to MyProfile</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>

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
                  <FormControl>
                    <FloatingLabelInput
                      label="Email address"
                      icon={<Mail className="h-5 w-5" />}
                      {...field}
                      className="rounded-md"
                    />
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
                  <FormControl>
                    <FloatingLabelInput
                      label="Password"
                      type="password"
                      icon={<Lock className="h-5 w-5" />}
                      {...field}
                      className="rounded-md"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="max-w-[10rem] w-full mx-auto">
              <AnimatedButton
                type="submit"
                className="h-12 "
                disabled={isLoading}
                active={!isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </AnimatedButton>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-center">
        <div className="text-sm text-muted-foreground mb-4">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>

        {/* Social Login Buttons */}
        <div className="w-full">
          <div className="relative mb-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
              OR CONTINUE WITH
            </span>
          </div>

          <div className="">
            <SocialLoginButtons
              onLoginStart={() => setIsLoading(true)}
              onLoginComplete={() => setIsLoading(false)}
            />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
