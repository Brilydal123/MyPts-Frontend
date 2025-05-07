"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BackButton } from "@/components/ui/back-button";
import { EnhancedPhoneInput } from "@/components/ui/enhanced-phone-input";
import { RegistrationData } from "../registration-flow";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  phoneNumber: z
    .string()
    .min(8, "Phone number must be at least 8 characters")
    .regex(/^\+?[0-9\s\-\(\)\.]+$/, "Please enter a valid phone number")
    .refine((val) => {
      // Basic validation - should start with + and have at least 8 digits
      return /^\+[0-9]/.test(val) && val.replace(/[^0-9]/g, "").length >= 8;
    }, "Please enter a valid international phone number with country code")
    .refine(
      (val) => {
        try {
          // Use libphonenumber-js to validate the phone number
          const phoneNumber = parsePhoneNumberFromString(val);
          return phoneNumber ? phoneNumber.isValid() : false;
        } catch (error) {
          return false;
        }
      },
      {
        message: "Please enter a valid phone number for the selected country",
      }
    ),
});

interface SetupStepProps {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function SetupStep({
  registrationData,
  updateRegistrationData,
  onNext,
  onPrev,
}: SetupStepProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: registrationData.phoneNumber || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Update registration data
      updateRegistrationData({
        phoneNumber: values.phoneNumber,
      });

      // Move to the next step
      onNext();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Setup Your Account...</h2>
        <p className="text-gray-600 text-sm">
          {registrationData.accountType === "MYSELF"
            ? "To setup your MyProfile account, please enter a valid phone number."
            : "To setup this secondary MyProfile account, please enter a valid phone number."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-2">
            <FormLabel className="text-sm text-gray-600">
              Type of Account
            </FormLabel>
            <div className="flex items-center h-12 px-4 rounded-md bg-background border border-gray-300">
              <div className="flex items-center">
                <span className="text-lg mr-2">
                  {registrationData.accountCategory === "PRIMARY_ACCOUNT"
                    ? "👤"
                    : "👥"}
                </span>
                <span className="font-medium">
                  {registrationData.accountCategory === "PRIMARY_ACCOUNT"
                    ? "Primary Account"
                    : "Secondary Account"}
                </span>
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-600">
                  Phone Number
                </FormLabel>
                <FormControl>
                  <EnhancedPhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="(XXX) XXX-XXXX (required)"
                    initialCountry={registrationData.countryOfResidence}
                    onValidityChange={(isValid) => {
                      if (isValid) {
                        form.clearErrors("phoneNumber");
                      } else {
                        // Set a generic error message that will be overridden by the component's specific message
                        form.setError("phoneNumber", {
                          type: "manual",
                          message: " " // Space to ensure the error container is rendered
                        });
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex  pt-4 mb-8 justify-between  mx-auto">
            <BackButton onClick={onPrev} className="" />
            <div className="">
              <Button
                type="submit"
                className="px-16 max-md:px-5"
                disabled={isLoading || !form.formState.isValid}
              >
                Continue
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
