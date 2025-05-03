"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { BackButton } from "@/components/ui/back-button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { motion } from "framer-motion";
import { RegistrationData } from "../registration-flow";
import { Check, X, Eye, EyeOff, Lock } from "lucide-react";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { authApi } from "@/lib/api/auth-api";
import { toast } from "sonner";

const formSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
      .regex(/[0-9]/, "Password must contain at least 1 number")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least 1 special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

interface SecureStepProps {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function SecureStep({
  registrationData,
  updateRegistrationData,
  onNext,
  onPrev,
}: SecureStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Update registration data
      updateRegistrationData({
        password: values.password,
      });

      // Check if the email is already registered before attempting to register
      const emailCheckResponse = await authApi.checkEmail(
        registrationData.email
      );

      if (emailCheckResponse.data?.exists) {
        // Email already exists, show error and redirect back to email step
        toast.error("Email already registered", {
          description:
            "Please use a different email address or login to your existing account.",
        });
        // Go back to the first step (email step)
        onPrev();
        onPrev();
        onPrev();
        return;
      }

      // Register the user with the backend
      const response = await authApi.register({
        email: registrationData.email,
        password: values.password,
        fullName: registrationData.fullName,
        username: registrationData.username,
        accountType: registrationData.accountType,
        dateOfBirth: registrationData.dateOfBirth || new Date(),
        phoneNumber: registrationData.phoneNumber,
        countryOfResidence: registrationData.countryOfResidence,
        verificationMethod: registrationData.verificationMethod,
        accountCategory: registrationData.accountCategory,
      });

      if (!response.success) {
        // Check if the error is due to email already registered
        if (response.message?.includes("Email already registered")) {
          // Go back to the first step (email step)
          toast.error("Email already registered", {
            description:
              "Please use a different email address or login to your existing account.",
          });
          onPrev();
          onPrev();
          onPrev();
          return;
        }

        // Check if the error is due to username already taken
        if (response.message?.includes("Username already taken")) {
          // Go back to the basic info step
          toast.error("Username already taken", {
            description: "Please choose a different username.",
          });
          onPrev();
          onPrev();
          return;
        }

        // Check if the error is due to phone number already registered
        if (response.message?.includes("Phone number already registered")) {
          // Go back to the setup step
          toast.error("Phone number already registered", {
            description: "Please use a different phone number.",
          });
          onPrev();
          return;
        }

        throw new Error(response.message || "Registration failed");
      }

      // Store the userId in localStorage for verification step
      if (response.data?.userId) {
        localStorage.setItem("registrationUserId", response.data.userId);
        console.log("Stored userId in localStorage:", response.data.userId);
      } else {
        console.error("No userId returned from registration API");
      }

      // Show success message with OTP for development (remove in production)
      const otpMessage = response.data?.otpChannel
        ? `Please verify your account with the code sent to your ${response.data.otpChannel}.`
        : "Please verify your account with the code sent to you.";

      toast.success("Registration successful!", {
        description: otpMessage,
      });

      // Move to the next step
      onNext();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Registration failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check password strength
  const password = form.watch("password");
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return 0;

    let strength = 0;
    if (hasMinLength) strength += 1;
    if (hasUppercase) strength += 1;
    if (hasNumber) strength += 1;
    if (hasSpecial) strength += 1;

    return strength;
  };

  const passwordStrength = getPasswordStrength();

  // Get strength text and color
  const getStrengthInfo = () => {
    if (!password)
      return {
        text: "No password",
        color: "gray",
        bgColor: "bg-gray-400",
        textColor: "text-gray-600",
      };
    if (passwordStrength === 1)
      return {
        text: "Weak",
        color: "red",
        bgColor: "bg-red-500",
        textColor: "text-red-600",
      };
    if (passwordStrength === 2)
      return {
        text: "Fair",
        color: "orange",
        bgColor: "bg-orange-500",
        textColor: "text-orange-600",
      };
    if (passwordStrength === 3)
      return {
        text: "Good",
        color: "blue",
        bgColor: "bg-blue-500",
        textColor: "text-blue-600",
      };
    if (passwordStrength === 4)
      return {
        text: "Strong",
        color: "green",
        bgColor: "bg-green-500",
        textColor: "text-green-600",
      };
    return {
      text: "No password",
      color: "gray",
      bgColor: "bg-gray-400",
      textColor: "text-gray-600",
    };
  };

  const strengthInfo = getStrengthInfo();

  return (
    <div className="flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-1">Secure Your Account</h2>
        <p className="text-gray-600 text-sm">
          Create a strong password for your MyProfile account to keep your
          information safe.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="relative">
                  <FormControl>
                    <div className="relative">
                      <FloatingLabelInput
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        icon={<Lock className="h-5 w-5" />}
                        {...field}
                        className="pr-10 pl-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password strength meter */}
          {password && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Password Strength:</span>
                <span
                  className={`text-xs font-medium ${strengthInfo.textColor}`}
                >
                  {strengthInfo.text}
                </span>
              </div>
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${strengthInfo.bgColor}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${(passwordStrength / 4) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {/* Password requirements - only shown when password doesn't meet all requirements */}
          {password && passwordStrength < 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-sm p-4 rounded-lg border border-gray-200 shadow-sm"
            >
              <p className="text-sm font-medium mb-2">Password Requirements:</p>
              <div className="space-y-2">
                <div className="flex items-center">
                  {hasMinLength ? (
                    <Check
                      size={16}
                      className="text-green-500 mr-2 flex-shrink-0"
                    />
                  ) : (
                    <X size={16} className="text-red-500 mr-2 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      hasMinLength ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center">
                  {hasUppercase ? (
                    <Check
                      size={16}
                      className="text-green-500 mr-2 flex-shrink-0"
                    />
                  ) : (
                    <X size={16} className="text-red-500 mr-2 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      hasUppercase ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    At least 1 uppercase letter (A-Z)
                  </span>
                </div>
                <div className="flex items-center">
                  {hasNumber ? (
                    <Check
                      size={16}
                      className="text-green-500 mr-2 flex-shrink-0"
                    />
                  ) : (
                    <X size={16} className="text-red-500 mr-2 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      hasNumber ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    At least 1 number (0-9)
                  </span>
                </div>
                <div className="flex items-center">
                  {hasSpecial ? (
                    <Check
                      size={16}
                      className="text-green-500 mr-2 flex-shrink-0"
                    />
                  ) : (
                    <X size={16} className="text-red-500 mr-2 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      hasSpecial ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    At least 1 special character (!@#$%^&*)
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <div className="relative">
                  <FormControl>
                    <div className="relative">
                      <FloatingLabelInput
                        label="Confirm Password"
                        type={showConfirmPassword ? "text" : "password"}
                        icon={<Lock className="h-5 w-5" />}
                        {...field}
                        className="pr-10 pl-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-6 mt-4 mb-8">
            <BackButton onClick={onPrev} className="px-[2rem]" />
            <AnimatedButton
              type="submit"
              className="h-12 px-10 rounded-md"
              active={form.formState.isValid}
              disabled={isLoading || !form.formState.isValid}
            >
              Continue
            </AnimatedButton>
          </div>
        </form>
      </Form>
    </div>
  );
}
