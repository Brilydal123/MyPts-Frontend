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
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";

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
    <div className="w-full max-w-lg border rounded-xl overflow-hidden p-10 gap-5 flex flex-col">
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
                  <FloatingLabelInput
                    label="Password"
                    type="password"
                    {...field}
                    className="rounded-md"
                  />
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
              className="text-sm text-muted-foreground hover:underline"
            >
              Trouble logging in?
            </Link>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !form.formState.isValid}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>
      <div className="flex flex-col space-y-4 text-center">
        <div className="text-sm text-muted-foreground mb-4">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Create an account
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
