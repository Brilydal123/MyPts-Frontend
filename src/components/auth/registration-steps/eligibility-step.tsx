"use client";

import { Button } from "@/components/ui/button";
import { CountrySelector } from "@/components/ui/country-selector";
import { DatePicker } from "@/components/ui/responsive-date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { RegistrationData } from "../registration-flow";
import { BackButton } from "@/components/ui/back-button";

const formSchema = z.object({
  accountType: z.enum(["MYSELF", "SOMEONE_ELSE"]),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }).refine((date) => {
    // Calculate age
    const today = new Date();
    const birthDate = new Date(date);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Validate age is at least 18
    return age >= 18;
  }, { message: "You must be at least 18 years old to register" }),
  countryOfResidence: z.string().min(1, "Country of residence is required"),
  accountCategory: z.enum(["PRIMARY_ACCOUNT", "SECONDARY_ACCOUNT"]),
});

// Define the type for our form values
type FormValues = z.infer<typeof formSchema>;

interface EligibilityStepProps {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function EligibilityStep({
  registrationData,
  updateRegistrationData,
  onNext,
  onPrev,
}: EligibilityStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [accountType, setAccountType] = useState<"MYSELF" | "SOMEONE_ELSE">(
    registrationData.accountType || "MYSELF"
  );

  // Initialize the form with proper types
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountType: registrationData.accountType || "MYSELF",
      dateOfBirth: registrationData.dateOfBirth || undefined,
      countryOfResidence: registrationData.countryOfResidence || "",
      accountCategory: registrationData.accountCategory || "PRIMARY_ACCOUNT",
    },
  });

  // Update account category when account type changes
  useEffect(() => {
    if (accountType === "MYSELF") {
      form.setValue("accountCategory", "PRIMARY_ACCOUNT");
    } else {
      form.setValue("accountCategory", "SECONDARY_ACCOUNT");
    }
  }, [accountType, form]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Update registration data
      updateRegistrationData({
        accountType: values.accountType,
        dateOfBirth: values.dateOfBirth,
        countryOfResidence: values.countryOfResidence,
        accountCategory: values.accountCategory,
      });

      // Move to the next step
      onNext();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const elegibilities = [
    {
      accountType: "MYSELF",
      dateOfBirth: new Date("2025-01-01"),
      label: "My Self",
    },
    {
      accountType: "SOMEONE_ELSE",
      dateOfBirth: new Date("2025-01-01"),
      label: "Someone Else",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="">
        <h2 className="text-xl font-semibold mb-1">
          Verify Your Eligibility...
        </h2>
        <p className="text-gray-600 text-sm">Who is this account for?</p>
      </div>

      <div className="flex justify-center space-x-4 w-full">
        {elegibilities.map((eligibility) => (
          <Button
            key={eligibility.accountType}
            type="button"
            variant={
              accountType === eligibility.accountType ? "default" : "ghost"
            }
            className={cn(
              "w-full border rounded-full",
              accountType === eligibility.accountType && "border-transparen"
            )}
            onClick={() => {
              setAccountType(
                eligibility.accountType as "MYSELF" | "SOMEONE_ELSE"
              );
              form.setValue(
                "accountType",
                eligibility.accountType as "MYSELF" | "SOMEONE_ELSE"
              );
            }}
          >
            {eligibility.label}
          </Button>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-gray-600 text-sm mt-4">Who is this account for?</p>

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DatePicker
                    placeholder="Select Date of Birth"
                    value={field.value}
                    onChange={field.onChange}
                    minAge={18} // Enforce minimum age of 18
                    disabled={field.value && field.value > new Date()}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="countryOfResidence"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <CountrySelector
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select Country of Residence"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mt-2">
            <p className="text-xs text-gray-600 mb-1">Type of Account</p>
            <FormField
              control={form.control}
              name="accountCategory"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      value={
                        field.value === "PRIMARY_ACCOUNT"
                          ? "Primary Account"
                          : "Secondary Account"
                      }
                      readOnly
                      className="h-12 px-4 rounded-md border border-gray-300"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
