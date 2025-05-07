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
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { BackButton } from "@/components/ui/back-button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { motion, AnimatePresence } from "framer-motion";
import { RegistrationData } from "../registration-flow";
import { authApi } from "@/lib/api/auth-api";
import { toast } from "sonner";
import { UsernameSuggestionsDialog } from "@/components/ui/username-suggestions-dialog";
import ReferralService from "@/services/referralService";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-zA-Z0-9_~.-]+$/,
      "Username can only contain letters, numbers, and special characters like _, ~, ., -"
    ),
  wasReferred: z.boolean().optional(),
  referralCode: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 6, {
      message: "Referral code must be at least 6 characters if provided",
    }),
});

interface BasicInfoStepProps {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function BasicInfoStep({
  registrationData,
  updateRegistrationData,
  onNext,
  onPrev,
}: BasicInfoStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [referralAnswer, setReferralAnswer] = useState<"yes" | "no">(
    registrationData.wasReferred
      ? "yes"
      : registrationData.wasReferred === false
        ? "no"
        : "no"
  );
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: registrationData.fullName || "",
      username: registrationData.username || "",
      wasReferred: registrationData.wasReferred || false,
      referralCode: registrationData.referralCode || "",
    },
    mode: "onChange", // Validate on change for real-time feedback
  });

  const fullName = form.watch("fullName");
  const username = form.watch("username");
  const referralCode = form.watch("referralCode");

  // Track if we're validating the referral code
  const [isValidatingReferralCode, setIsValidatingReferralCode] = useState(false);

  // Watch for changes in the referral code field
  useEffect(() => {
    // If user manually enters a referral code and the field wasn't empty before
    if (referralCode && referralCode.length > 0 && referralAnswer !== "yes") {
      console.log("User manually entered a referral code, setting referralAnswer to yes");
      setReferralAnswer("yes");
    }

    // Debounced validation of the referral code
    if (referralCode && referralCode.length >= 6 && referralAnswer === "yes") {
      // Clear any previous errors
      form.clearErrors("referralCode");

      // Set a small delay before validating to avoid too many API calls
      const timer = setTimeout(() => {
        console.log("Validating referral code:", referralCode);
        setIsValidatingReferralCode(true);

        ReferralService.validateReferralCode(referralCode)
          .then(result => {
            if (result.valid) {
              console.log("Referral code is valid:", referralCode);
              // Clear any errors
              form.clearErrors("referralCode");
            } else {
              console.warn("Invalid referral code:", referralCode);
              // Set error
              form.setError("referralCode", {
                type: "manual",
                message: "Invalid referral code. Please check and try again."
              });
            }
          })
          .catch(error => {
            console.error("Error validating referral code:", error);
          })
          .finally(() => {
            setIsValidatingReferralCode(false);
          });
      }, 800); // 800ms debounce

      return () => clearTimeout(timer);
    }
  }, [referralCode, referralAnswer, form]);

  // Check if form is valid and complete
  const isFormValid = form.formState.isValid;
  const isFormComplete =
    !!fullName &&
    !!username &&
    referralAnswer !== null &&
    (referralAnswer === "no" || (referralAnswer === "yes" && !!referralCode));

  // Force validation when username changes
  useEffect(() => {
    if (username && username.length >= 3) {
      // Trigger validation to update form.formState.isValid
      form.trigger();
    }
  }, [username, form]);

  // Update referral answer and form values if they change in registrationData (e.g., from URL parameter)
  // This effect should only run once on component mount
  useEffect(() => {
    // Only update if the initial values don't match
    const initialWasReferred = registrationData.wasReferred;
    const initialReferralCode = registrationData.referralCode;

    // Set initial referral answer based on registrationData
    if (initialWasReferred && referralAnswer !== "yes") {
      console.log("Setting initial referral answer to YES based on registrationData");
      setReferralAnswer("yes");
    }

    // Set initial referral code based on registrationData
    if (initialReferralCode && initialReferralCode !== form.getValues().referralCode) {
      console.log("Setting initial referral code based on registrationData:", initialReferralCode);
      form.setValue("referralCode", initialReferralCode);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle selecting a suggested username
  const handleSelectUsername = (selectedUsername: string) => {
    // Set the value and trigger validation
    form.setValue("username", selectedUsername, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });

    // Clear any existing errors
    form.clearErrors("username");

    // Clear suggestions and reset flag
    setUsernameSuggestions([]);
    setHasGeneratedSuggestions(false);

    console.log("Username selected:", selectedUsername);
    console.log("Form state after selection:", form.formState);

    // Force a re-validation of the form
    form.trigger();
  };

  // Track if we've already generated suggestions for the current username
  const [hasGeneratedSuggestions, setHasGeneratedSuggestions] = useState(false);

  // Debounced username check
  useEffect(() => {
    // Reset the flag when username changes
    if (username !== form.getValues().username) {
      setHasGeneratedSuggestions(false);
    }

    // Don't clear suggestions if there's an error (username taken)
    if (usernameSuggestions.length > 0 && !form.formState.errors.username) {
      console.log(
        "Clearing username suggestions because username changed and no errors"
      );
      setUsernameSuggestions([]);
    }

    if (!username || username.length < 3) return;

    // Skip the check if we've already generated suggestions for this username
    if (hasGeneratedSuggestions && form.formState.errors.username) {
      console.log(
        "Skipping username check because suggestions were already generated"
      );
      return;
    }

    // Set a loading state for the username field
    const usernameField = document.querySelector('input[name="username"]');
    if (usernameField) {
      usernameField.classList.add("checking");
    }

    const timer = setTimeout(async () => {
      try {
        const response = await authApi.checkUsername(username);

        // If the check was not successful, show a warning but don't block the field
        if (!response.success) {
          console.warn("Username check failed:", response.message);
          // We don't set an error here to allow the user to continue typing
        }
        // If the username exists, show an error and generate suggestions
        else if (response.data?.exists) {
          console.log("Username already taken, generating suggestions");

          form.setError("username", {
            type: "manual",
            message:
              "This username is already taken. Please choose a different one.",
          });

          // Only generate suggestions if we haven't already done so for this username
          if (!hasGeneratedSuggestions) {
            // Mark that we've generated suggestions for this username
            setHasGeneratedSuggestions(true);

            // Automatically generate username suggestions
            setUsernameSuggestions([]);
            setIsGeneratingSuggestions(true);

            try {
              // Only generate suggestions if we have a full name
              if (!fullName) {
                console.warn(
                  "Cannot generate username suggestions: fullName is empty"
                );
                setIsGeneratingSuggestions(false);
                return;
              }

              console.log(
                "Automatically generating username suggestions for:",
                fullName
              );
              const suggestionsResponse = await authApi.generateUsernames(
                fullName
              );
              console.log(
                "Username suggestions response:",
                suggestionsResponse
              );

              if (
                suggestionsResponse.success &&
                suggestionsResponse.data?.usernames.length
              ) {
                console.log(
                  "Setting username suggestions:",
                  suggestionsResponse.data.usernames
                );

                // Set the suggestions
                setUsernameSuggestions(suggestionsResponse.data.usernames);

                // Show a toast with the suggestions
                toast.info("Username suggestions available", {
                  description:
                    "We've generated some username suggestions for you below.",
                });
              }
            } catch (suggestionError) {
              console.error(
                "Error generating username suggestions:",
                suggestionError
              );
            } finally {
              setIsGeneratingSuggestions(false);
            }
          }
        } else {
          // Clear any existing errors if the username is available
          form.clearErrors("username");
          // Clear any suggestions
          setUsernameSuggestions([]);
          // Reset the flag
          setHasGeneratedSuggestions(false);
        }
      } catch (error) {
        console.error("Error checking username:", error);
        // We don't set an error here to allow the user to continue typing
      } finally {
        // Remove loading state
        if (usernameField) {
          usernameField.classList.remove("checking");
        }
      }
    }, 800); // 800ms debounce

    return () => {
      clearTimeout(timer);
      // Remove loading state on cleanup
      if (usernameField) {
        usernameField.classList.remove("checking");
      }
    };
  }, [username, form, fullName, hasGeneratedSuggestions]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Check if the username is already taken
      const usernameCheckResponse = await authApi.checkUsername(
        values.username
      );

      // If the check was not successful (network error, server down, etc.), prevent proceeding
      if (!usernameCheckResponse.success) {
        toast.error("Unable to verify username availability", {
          description:
            usernameCheckResponse.message ||
            "Please check your connection and try again.",
        });
        form.setError("username", {
          type: "manual",
          message:
            "Unable to verify if this username is available. Please try again.",
        });
        return;
      }

      // If the username exists, show error (suggestions will be generated automatically)
      if (usernameCheckResponse.data?.exists) {
        toast.error("Username already taken", {
          description:
            "Please choose a different username or select one of our suggestions.",
        });
        form.setError("username", {
          type: "manual",
          message:
            "This username is already taken. Please choose a different one.",
        });

        // Only generate suggestions if we haven't already done so
        if (!hasGeneratedSuggestions) {
          setHasGeneratedSuggestions(true);

          // Generate username suggestions
          setUsernameSuggestions([]);
          setIsGeneratingSuggestions(true);

          try {
            console.log(
              "Generating username suggestions on submit for:",
              values.fullName
            );
            const suggestionsResponse = await authApi.generateUsernames(
              values.fullName
            );

            if (
              suggestionsResponse.success &&
              suggestionsResponse.data?.usernames.length
            ) {
              setUsernameSuggestions(suggestionsResponse.data.usernames);

              toast.info("Username suggestions available", {
                description:
                  "We've generated some username suggestions for you below.",
              });
            }
          } catch (error) {
            console.error("Error generating username suggestions:", error);
          } finally {
            setIsGeneratingSuggestions(false);
          }
        }

        return;
      }

      // Validate referral code if provided
      if (referralAnswer === "yes" && values.referralCode) {
        try {
          const validationResult = await ReferralService.validateReferralCode(
            values.referralCode
          );

          if (!validationResult.valid) {
            form.setError("referralCode", {
              type: "manual",
              message: "Invalid referral code. Please check and try again.",
            });
            toast.error("Invalid referral code", {
              description:
                "The referral code you entered is not valid. Please check and try again.",
            });
            return;
          }
        } catch (error) {
          console.error("Error validating referral code:", error);
          form.setError("referralCode", {
            type: "manual",
            message: "Error validating referral code. Please try again.",
          });
          toast.error("Error validating referral code", {
            description:
              "We encountered an error while validating your referral code. Please try again.",
          });
          return;
        }
      }

      // Update registration data
      const updateData: Partial<RegistrationData> = {
        fullName: values.fullName,
        username: values.username,
        wasReferred: referralAnswer === "yes",
      };

      // Add referral information if user was referred
      if (referralAnswer === "yes") {
        updateData.referralCode = values.referralCode;
      }

      updateRegistrationData(updateData);

      // Move to the next step
      onNext();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error checking username", {
        description:
          "Unable to verify username availability. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Direct handler functions instead of array
  const handleYesClick = () => {
    console.log("YES button clicked, setting referralAnswer to yes");
    setReferralAnswer("yes");
  };

  const handleNoClick = () => {
    console.log("NO button clicked, setting referralAnswer to no");
    setReferralAnswer("no");
  };

  // Debug log for referralAnswer changes
  useEffect(() => {
    console.log("referralAnswer changed:", referralAnswer);
  }, [referralAnswer]);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h2 className="text-xl font-semibold mb-1">Let's Get Started...</h2>
        <p className="text-gray-600 text-sm">Did someone refer you?</p>
      </div>

      <div className="flex justify-center space-x-4">
        <Button
          variant={referralAnswer === "yes" ? "default" : "ghost"}
          onClick={handleYesClick}
          className={cn(
            "w-full rounded-full border",
            referralAnswer === "yes" && "border-transparent"
          )}
        >
          YES
        </Button>
        <Button
          variant={referralAnswer === "no" ? "default" : "ghost"}
          onClick={handleNoClick}
          className={cn(
            "w-full rounded-full border",
            referralAnswer === "no" && "border-transparent"
          )}
        >
          NO
        </Button>
      </div>

      <div className="text-sm  mb-4 text-muted-foreground">
        Provide some basic information to start your journey.
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput
                    label="Full Name"
                    {...field}
                    className={`rounded-md ${fullName
                      ? form.formState.errors.fullName
                        ? "border-red-300"
                        : "border-green-300"
                      : ""
                      }`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <FloatingLabelInput
                    label="Username"
                    {...field}
                    className={`rounded-md ${username
                      ? form.formState.errors.username
                        ? "border-red-300"
                        : "border-green-300"
                      : ""
                      }`}
                  />
                </FormControl>
                <FormMessage />

                {/* Username suggestions */}
                {/* Debug info */}
                {(() => {
                  console.log("Rendering username suggestions section:", {
                    usernameSuggestionsLength: usernameSuggestions.length,
                    isGeneratingSuggestions,
                    shouldShow:
                      usernameSuggestions.length > 0 || isGeneratingSuggestions,
                  });
                  return null;
                })()}
                {/* Username suggestions dialog */}
                <UsernameSuggestionsDialog
                  suggestions={usernameSuggestions}
                  onSelect={handleSelectUsername}
                  onClose={() => setUsernameSuggestions([])}
                  isLoading={isGeneratingSuggestions}
                  open={
                    usernameSuggestions.length > 0 || isGeneratingSuggestions
                  }
                />
              </FormItem>
            )}
          />

          {/* Debug info for referral code field */}
          {(() => {
            console.log("Rendering referral section, referralAnswer =", referralAnswer);
            return null;
          })()}

          {/* Restored motion animation with AnimatePresence */}
          <AnimatePresence>
            {referralAnswer === "yes" && (
              <motion.div
                key="referral-code-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 pt-2"
              >
                <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FloatingLabelInput
                          label="Enter Referral Code"
                          {...field}
                          className={`rounded-md ${isValidatingReferralCode ? 'checking' : ''} ${referralCode
                            ? form.formState.errors.referralCode
                              ? "border-red-300"
                              : "border-green-300"
                            : ""
                            }`}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* <div className="flex justify-between pt-4">
            <Button onClick={onPrev} variant="ghost">
              <ArrowLeft className="size-4" /> Back
            </Button>
            <div>
              <Button
                type="submit"
                className="px-16"
                disabled={isLoading || !isFormValid || !isFormComplete}
              >
                {isFormComplete ? "Continue" : "Complete Form"}
              </Button>
            </div>
          </div> */}
          <div className="flex  pt-4 mb-8 justify-between  mx-auto">
            <BackButton onClick={onPrev} className="" />
            <div className="">
              <Button
                type="submit"
                className="px-16 max-md:px-5"
                disabled={isLoading || !form.formState.isValid || !isFormComplete}
                onClick={() => {
                  // Log form state for debugging
                  console.log("Form state on button click:", {
                    isValid: form.formState.isValid,
                    isFormComplete,
                    errors: form.formState.errors,
                    values: form.getValues()
                  });

                  // If the form is not valid but seems complete, try to trigger validation
                  if (!form.formState.isValid && isFormComplete) {
                    form.trigger();
                  }
                }}
              >
                {isFormComplete ? "Continue" : "Complete Form"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
