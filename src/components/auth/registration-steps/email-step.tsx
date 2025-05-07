"use client";

import { Button } from "@/components/ui/button";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { authApi } from "@/lib/api/auth-api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { RegistrationData } from "../registration-flow";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

interface EmailRegistrationStepProps {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
  onPrev?: () => void;
}

export function EmailRegistrationStep({
  registrationData,
  updateRegistrationData,
  onNext,
}: EmailRegistrationStepProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: registrationData.email || "",
    },
    mode: "onChange", // Validate on change for real-time feedback
  });

  const email = form.watch("email");
  const isEmailValid = email && !form.formState.errors.email;

  // Debounced email check
  useEffect(() => {
    if (!isEmailValid || !email) return;

    const emailField = document.querySelector('input[name="email"]');
    if (emailField) {
      emailField.classList.add("checking");
    }

    const timer = setTimeout(async () => {
      try {
        const response = await authApi.checkEmail(email);

        // If the check was not successful, show a warning but don't block the field
        if (!response.success) {
          console.warn("Email check failed:", response.message);
          // We don't set an error here to allow the user to continue typing
        }
        // If the email exists, show an error
        else if (response.data?.exists) {
          form.setError("email", {
            type: "manual",
            message:
              "This email is already registered. Please use a different email or login.",
          });
        } else {
          // Clear any existing errors if the email is available
          form.clearErrors("email");
        }
      } catch (error) {
        console.error("Error checking email:", error);
        // We don't set an error here to allow the user to continue typing
      } finally {
        // Remove loading state
        if (emailField) {
          emailField.classList.remove("checking");
        }
      }
    }, 800); // 800ms debounce

    return () => {
      clearTimeout(timer);
      // Remove loading state on cleanup
      if (emailField) {
        emailField.classList.remove("checking");
      }
    };
  }, [email, form, isEmailValid]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Check if the email is already registered
      const emailCheckResponse = await authApi.checkEmail(values.email);

      // If the check was not successful (network error, server down, etc.), prevent proceeding
      if (!emailCheckResponse.success) {
        toast.error("Unable to verify email availability", {
          description:
            emailCheckResponse.message ||
            "Please check your connection and try again.",
        });
        form.setError("email", {
          type: "manual",
          message:
            "Unable to verify if this email is available. Please try again.",
        });
        return;
      }

      // If the email exists, show error and prevent proceeding
      if (emailCheckResponse.data?.exists) {
        toast.error("Email already registered", {
          description:
            "Please use a different email address or login to your existing account.",
        });
        form.setError("email", {
          type: "manual",
          message:
            "This email is already registered. Please use a different email or login.",
        });
        return;
      }

      // Email is available, update registration data
      updateRegistrationData({ email: values.email });

      // Move to the next step
      onNext();
    } catch (error) {
      console.error("Error checking email:", error);
      toast.error("Error checking email", {
        description:
          "Unable to verify email availability. Please check your connection and try again.",
      });
      form.setError("email", {
        type: "manual",
        message:
          "Unable to verify if this email is available. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col  w-full">
      <div className="text-center mb-6">
        <div className="mr-4 p-2 flex justify-center items-center pb-4 space-x-2">
          <motion.img
            src="/profilewhite.png"
            alt="MyProfile"
            width="55"
            height="55"
            className="object-contain"
            whileHover={{ rotate: 10, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          />
          <motion.h1
            className="text-3xl font-bold"
            style={{ fontFamily: "Manrope" }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <span className="bg-clip-text font-extrabold text-4xl">My</span>
            <span className="font-normal bg-clip-text  bg-gradient-to-r from-gray-700 to-gray-400">
              Profile
            </span>
          </motion.h1>
        </div>

        <h2 className="text-xl font-semibold mb-1">
          Register for your free account!
        </h2>
        <p className="text-gray-600 text-sm">
          To start your journey with us, provide a valid email address.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-center items-center">
                <FormControl>
                  <FloatingLabelInput
                    label="Email address"
                    {...field}
                    className={cn("rounded-md", {
                      "border-green-300": email && isEmailValid,
                      "border-red-300": email && !isEmailValid,
                    })}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-xs text-gray-600 text-center line-clamp-3">
            We will send you a verification code to the email for verification
            purpose.{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Learn what we do with your data
            </Link>
            .
          </div>

          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isLoading || !isEmailValid}
              className="w-full"
            >
              {isLoading
                ? "Processing..."
                : isEmailValid
                  ? "Save & Continue"
                  : "Enter Valid Email"}
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>{" "}
          or{" "}
          <Link href="/claim-account" className="text-blue-600 hover:underline">
            Claim Account
          </Link>
        </p>
      </div>

      <div className="flex-grow"></div>

      <div className="mt-6 mb-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              OR CONTINUE WITH
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 mb-4">
        <SocialLoginButtons
          onLoginStart={() => setIsLoading(true)}
          onLoginComplete={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
}
