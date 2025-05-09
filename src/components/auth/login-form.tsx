"use client";

import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "../ui/button";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { motion } from "framer-motion";

// Animated ellipsis component
function AnimatedEllipsis() {
  return (
    <span className="inline-flex ml-1">
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      >
        .
      </motion.span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.2 }}
      >
        .
      </motion.span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.4 }}
      >
        .
      </motion.span>
    </span>
  );
}

const formSchema = z.object({
  identifier: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const error = searchParams?.get("error") || null;
  const callbackUrl = searchParams?.get("callbackUrl") || "/select-profile";
  const isLogout = searchParams?.get("logout") === "true";

  useEffect(() => {
    if (isLogout) {
      toast.success("Logged out successfully");
    }

    // Show error message if there's an error in the URL
    if (error) {
      let errorDescription = "Please check your credentials and try again.";

      // Handle specific error cases
      if (error === "CredentialsSignin") {
        errorDescription = "We couldn't sign you in with these credentials. Please check your email and password.";
      }

      toast.error("Unable to sign in", {
        description: errorDescription,
      });
    }
  }, [isLogout, error]);

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
        // Provide a more user-friendly error message
        let errorDescription = "Please check your email and password and try again.";

        // Handle specific error cases
        if (result.error === "CredentialsSignin") {
          errorDescription = "We couldn't sign you in with these credentials. Please check your email and password.";
        }

        toast.error("Unable to sign in", {
          description: errorDescription,
        });
      } else {
        // Get the session to extract the access token
        try {
          const response = await fetch("/api/auth/session");
          const session = await response.json();
          console.log("Session after login:", session);

          // Store tokens in multiple places for better compatibility
          if (session?.accessToken) {
            // Store in localStorage
            localStorage.setItem("accessToken", session.accessToken);

            // Store in cookies (both camelCase and lowercase for compatibility)
            document.cookie = `accessToken=${session.accessToken}; path=/; max-age=3600`; // 1 hour
            document.cookie = `accesstoken=${session.accessToken}; path=/; max-age=3600`; // 1 hour

            console.log("Access token stored in localStorage and cookies");
          }

          if (session?.refreshToken) {
            // Store in localStorage
            localStorage.setItem("refreshToken", session.refreshToken);

            // Store in cookies (both camelCase and lowercase for compatibility)
            document.cookie = `refreshToken=${session.refreshToken}; path=/; max-age=2592000`; // 30 days
            document.cookie = `refreshtoken=${session.refreshToken}; path=/; max-age=2592000`; // 30 days

            console.log("Refresh token stored in localStorage and cookies");
          }

          // Also store NextAuth compatible token for better integration
          if (session?.accessToken) {
            localStorage.setItem("next-auth.session-token", session.accessToken);
          }

          // Check if user is admin
          let isAdmin = false;
          try {
            const sessionResponse = await fetch("/api/auth/session");
            const sessionData = await sessionResponse.json();

            // Check if user is admin from session data
            isAdmin = sessionData?.user?.role === 'admin' || sessionData?.user?.isAdmin === true;

            console.log("Admin check during login:", { isAdmin, userData: sessionData?.user });

            // Store admin status in localStorage if admin
            if (isAdmin && typeof window !== 'undefined') {
              localStorage.setItem('isAdmin', 'true');
              console.log("Admin status stored in localStorage");
            }
          } catch (error) {
            console.error("Error checking admin status:", error);
          }

          // Redirect based on admin status
          if (isAdmin) {
            toast.success("Admin login successful", {
              description: "Redirecting to admin dashboard...",
            });
            router.push('/admin');
          } else {
            toast.success("Login successful", {
              description: "Redirecting to profile selection...",
            });
            router.push(callbackUrl);
          }
        } catch (sessionError) {
          console.error("Error getting session:", sessionError);
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Unable to sign in", {
        description: "We're having trouble connecting to our servers. Please check your internet connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg border rounded-xl overflow-hidden p-10 max-md:p-4 gap-5 flex flex-col bg-white shadow">
      <div>
        <h1 className="text-2xl font-bold">Welcome Back!</h1>
        <p className="text-muted-foreground">
          Log in to Continue Your networking Journey ...
        </p>
      </div>
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
                  <div className="relative">
                    <FloatingLabelInput
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      {...field}
                      className="rounded-md"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-between">
            <Label>
              <Checkbox />
              Remember me
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm text-blue-400 hover:underline"
            >
              Trouble logging in?
            </Link>
          </div>
          <Button
            type="submit"
            className="w-full min-h-[40px]"
            disabled={isLoading || !form.formState.isValid}
          >
            <div className="w-full flex items-center justify-center">
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="whitespace-nowrap">Signing in<AnimatedEllipsis /></span>
                </span>
              ) : (
                <span className="whitespace-nowrap">Sign in</span>
              )}
            </div>
          </Button>
        </form>
      </Form>
      <div className="flex flex-col space-y-4 text-center ">
        <div className="text-sm text-muted-foreground mb-4 space-x-2">
          <span>Don't have an account?{" "}</span>
          <Link href="/register" className="text-primary hover:underline">
            <span className="text-blue-400">Create an account</span>
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
      </div>
    </div>
  );
}
