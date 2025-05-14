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

// Define the form schema with proper types
const formSchema = z.object({
  identifier: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
});

// Define the type for our form values
type FormData = {
  identifier: string;
  password: string;
  rememberMe: boolean;
};

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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    try {
      // Function to attempt direct login with retry logic
      const attemptDirectLogin = async (retryCount = 0, maxRetries = 2): Promise<{ response: Response, data: any }> => {
        try {
          const directLoginResponse = await fetch('/api/auth/direct-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              identifier: values.identifier,
              password: values.password,
              rememberMe: values.rememberMe,
            }),
            credentials: 'include', // Important to include cookies
            // Add a timeout to the fetch request
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });

          const data = await directLoginResponse.json();
          return { response: directLoginResponse, data };
        } catch (error) {
          // Check if we should retry
          if (retryCount < maxRetries) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Only retry on timeout or network errors
            if (errorMessage.includes('timed out') ||
              errorMessage.includes('timeout') ||
              errorMessage.includes('network') ||
              errorMessage.includes('fetch')) {

              console.log(`Login attempt ${retryCount + 1} failed, retrying...`);

              // Show a toast for the retry
              if (retryCount === 0) {
                toast.info("Connection issue", {
                  description: "Retrying connection to our servers...",
                  duration: 3000,
                });
              }

              // Wait before retrying (exponential backoff)
              const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
              await new Promise(resolve => setTimeout(resolve, delay));

              // Retry the request
              return attemptDirectLogin(retryCount + 1, maxRetries);
            }
          }

          // If we've exhausted retries or it's not a retryable error, rethrow
          throw error;
        }
      };

      // Try direct login first with retry logic
      const { response: directLoginResponse, data: directLoginData } = await attemptDirectLogin();

      if (directLoginResponse.ok && directLoginData.success) {
        console.log("Direct login successful:", directLoginData);

        // Store tokens in localStorage for client-side access
        if (directLoginData.tokens?.accessToken) {
          localStorage.setItem("accessToken", directLoginData.tokens.accessToken);

          // Set token expiry time (1 hour from now or based on server response)
          const expiryTime = Date.now() + (directLoginData.tokens.expiresIn || 3600) * 1000;
          localStorage.setItem("tokenExpiry", expiryTime.toString());

          // Store user ID if available
          if (directLoginData.user?.id) {
            localStorage.setItem("userId", directLoginData.user.id);
          }

          // Store user data including country information
          if (directLoginData.user) {
            localStorage.setItem("user", JSON.stringify(directLoginData.user));

            // Store country information separately for easier access
            if (directLoginData.user.countryOfResidence) {
              localStorage.setItem("userCountry", directLoginData.user.countryOfResidence);
              console.log(`Stored user country in localStorage: ${directLoginData.user.countryOfResidence}`);

              // Also store in a cookie for cross-page access
              document.cookie = `userCountry=${encodeURIComponent(directLoginData.user.countryOfResidence)}; path=/; max-age=2592000; SameSite=Lax`;
            }
          }

          // Store last activity timestamp
          localStorage.setItem("lastActivity", Date.now().toString());

          console.log("Tokens stored in localStorage");

          // Also use NextAuth's signIn for session management
          await signIn("credentials", {
            redirect: false,
            identifier: values.identifier,
            password: values.password,
          });

          // Check if user is admin
          const isAdmin = directLoginData.user?.role === 'admin' || directLoginData.user?.isAdmin === true;

          if (isAdmin) {
            // Store admin status in localStorage
            localStorage.setItem('isAdmin', 'true');
            localStorage.setItem('userRole', 'admin');

            // Set cookies for admin status (for middleware detection)
            document.cookie = 'isAdmin=true; path=/; max-age=2592000; SameSite=Lax';
            document.cookie = 'X-User-Role=admin; path=/; max-age=2592000; SameSite=Lax';
            document.cookie = 'X-User-Is-Admin=true; path=/; max-age=2592000; SameSite=Lax';

            toast.success("Admin login successful", {
              description: "Redirecting to admin dashboard...",
            });

            // Use hard redirect instead of router.push for immediate effect
            console.log("Admin user detected, using hard redirect to admin dashboard");
            window.location.href = '/admin';
            return;
          } else {
            toast.success("Login successful", {
              description: "Redirecting to profile selection...",
            });

            // Redirect to select profile page
            router.push(callbackUrl);
          }
          return;
        }
      } else {
        // Check for specific error types and display appropriate messages
        const errorMessage = directLoginData.message || '';
        console.error("Direct login failed:", errorMessage);

        // Handle connection timeout errors
        if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
          toast.error("Connection issue", {
            description: "We're having trouble connecting to our servers. Please check your internet connection and try again in a moment.",
            duration: 5000,
          });

          // Add a small delay before falling back to NextAuth
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Fall back to NextAuth signIn if direct login failed
      const result = await signIn("credentials", {
        identifier: values.identifier,
        password: values.password,
        redirect: false,
      });

      console.log("SignIn result:", result);

      if (result?.error) {
        // Provide a more user-friendly error message
        let errorTitle = "Unable to sign in";
        let errorDescription = "Please check your email and password and try again.";

        // Handle specific error cases
        if (result.error === "CredentialsSignin") {
          errorDescription = "We couldn't sign you in with these credentials. Please check your email and password.";
        } else if (result.error.includes('timed out') || result.error.includes('timeout')) {
          errorTitle = "Connection timeout";
          errorDescription = "We're having trouble connecting to our servers. Please check your internet connection and try again in a moment.";
        } else if (result.error.includes('network') || result.error.includes('Network') ||
          result.error.includes('ECONNREFUSED') || result.error.includes('fetch')) {
          errorTitle = "Network issue";
          errorDescription = "Unable to connect to our servers. Please check your internet connection and try again.";
        } else if (result.error.includes('server') || result.error.includes('500')) {
          errorTitle = "Server issue";
          errorDescription = "Our servers are experiencing some issues. Please try again in a few minutes.";
        }

        toast.error(errorTitle, {
          description: errorDescription,
          duration: 5000,
        });
      } else {
        console.log("Login successful, waiting for session to be established...");

        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get the session to extract the access token
        try {
          const response = await fetch("/api/auth/session");
          const session = await response.json();
          console.log("Session after login:", session);

          // If session is empty, try to get tokens from the backend directly
          if (!session?.accessToken) {
            console.log("Session doesn't contain tokens, fetching from backend...");
            try {
              const backendResponse = await fetch('/api/auth/session-tokens', {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: 'include', // Important to include cookies
              });

              if (backendResponse.ok) {
                const data = await backendResponse.json();
                console.log("Tokens from backend:", data);

                if (data.success && data.tokens) {
                  // Update session object with tokens
                  session.accessToken = data.tokens.accessToken;
                  session.profileId = data.tokens.profileId;
                  session.profileToken = data.tokens.profileToken;
                }
              } else {
                const errorData = await backendResponse.json();
                console.error("Failed to fetch tokens from backend:", errorData);
              }
            } catch (error) {
              console.error("Error fetching tokens from backend:", error);
            }
          }

          // Store tokens in localStorage for client-side access
          if (session?.accessToken) {
            // Store in localStorage
            localStorage.setItem("accessToken", session.accessToken);

            // Set token expiry time (1 hour from now)
            const expiryTime = Date.now() + (60 * 60 * 1000);
            localStorage.setItem("tokenExpiry", expiryTime.toString());

            console.log("Access token stored in localStorage");
          }

          // Store profile information if available
          if (session?.profileId) {
            localStorage.setItem("selectedProfileId", session.profileId);
          }

          if (session?.profileToken) {
            localStorage.setItem("selectedProfileToken", session.profileToken);
          }

          // Store last activity timestamp
          localStorage.setItem("lastActivity", Date.now().toString());

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
            // Store admin status in cookies for middleware detection
            document.cookie = 'isAdmin=true; path=/; max-age=2592000; SameSite=Lax';
            document.cookie = 'X-User-Role=admin; path=/; max-age=2592000; SameSite=Lax';
            document.cookie = 'X-User-Is-Admin=true; path=/; max-age=2592000; SameSite=Lax';

            toast.success("Admin login successful", {
              description: "Redirecting to admin dashboard...",
            });

            // Use hard redirect instead of router.push for immediate effect
            console.log("Admin user detected, using hard redirect to admin dashboard");
            window.location.href = '/admin';
            return;
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

      // Provide more specific error messages based on the error type
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('timed out') || errorMessage.includes('timeout')) {
        toast.error("Connection timeout", {
          description: "We're having trouble connecting to our servers. Please check your internet connection and try again in a moment.",
          duration: 5000,
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('Network') ||
        errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch')) {
        toast.error("Network issue", {
          description: "Unable to connect to our servers. Please check your internet connection and try again.",
          duration: 5000,
        });
      } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
        toast.error("Server issue", {
          description: "Our servers are experiencing some issues. Please try again in a few minutes.",
          duration: 5000,
        });
      } else {
        toast.error("Unable to sign in", {
          description: "An unexpected error occurred. Please try again or contact support if the issue persists.",
          duration: 5000,
        });
      }
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
        <form onSubmit={form.handleSubmit((data) => onSubmit(data as unknown as FormData))} className="space-y-4">
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
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <Label htmlFor="rememberMe" className="cursor-pointer">
                    Remember me
                  </Label>
                </FormItem>
              )}
            />
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
