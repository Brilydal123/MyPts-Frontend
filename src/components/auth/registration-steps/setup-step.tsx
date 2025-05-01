'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BackButton } from '@/components/ui/back-button';
import { AnimatedButton } from '@/components/ui/animated-button';
import { PhoneInput } from '@/components/ui/phone-input-v2';
import { RegistrationData } from '../registration-flow';

const formSchema = z.object({
  phoneNumber: z.string()
    .min(8, 'Phone number must be at least 8 characters')
    .regex(/^\+?[0-9\s\-\(\)\.]+$/, 'Please enter a valid phone number')
    .refine((val) => {
      // Basic validation - should start with + and have at least 8 digits
      return /^\+[0-9]/.test(val) && val.replace(/[^0-9]/g, '').length >= 8;
    }, 'Please enter a valid international phone number with country code'),
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
      phoneNumber: registrationData.phoneNumber || '',
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
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-1">Setup Your Account...</h2>
        <p className="text-gray-600 text-sm">
          {registrationData.accountType === 'MYSELF'
            ? "To setup your MyProfile account, please enter a valid phone number."
            : "To setup this secondary MyProfile account, please enter a valid phone number."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="mb-4">
            <FormLabel className="text-sm text-gray-600">Type of Account</FormLabel>
            <div className="flex items-center h-12 px-4 rounded-md bg-gray-100 border border-gray-300">
              <div className="flex items-center">
                <span className="text-lg mr-2">
                  {registrationData.accountCategory === 'PRIMARY_ACCOUNT' ? '👤' : '👥'}
                </span>
                <span className="font-medium">
                  {registrationData.accountCategory === 'PRIMARY_ACCOUNT' ? 'Primary Account' : 'Secondary Account'}
                </span>
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-600">Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="(XXX) XXX-XXXX (required)"
                    initialCountry={registrationData.countryOfResidence}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-between pt-4 mb-8">
            <BackButton
              onClick={onPrev}
              className="px-[2rem]"
            />
            <div>
              <AnimatedButton
                type="submit"
                className="h-12 px-10 rounded-md"
                active={form.formState.isValid}
                disabled={isLoading || !form.formState.isValid}
              >
                Continue
              </AnimatedButton>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
