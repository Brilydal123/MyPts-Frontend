'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { BackButton } from '@/components/ui/back-button';
import { AnimatedButton } from '@/components/ui/animated-button';
import { motion } from 'framer-motion';
import { RegistrationData } from '../registration-flow';
import { authApi } from '@/lib/api/auth-api';
import { toast } from 'sonner';
import { UsernameSuggestionsDialog } from '@/components/ui/username-suggestions-dialog';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_~.-]+$/, 'Username can only contain letters, numbers, and special characters like _, ~, ., -'),
  wasReferred: z.boolean().optional(),
  referralCode: z.string().optional(),
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
  const [referralAnswer, setReferralAnswer] = useState<'yes' | 'no' | null>(
    registrationData.wasReferred ? 'yes' : registrationData.wasReferred === false ? 'no' : null
  );
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: registrationData.fullName || '',
      username: registrationData.username || '',
      wasReferred: registrationData.wasReferred || false,
      referralCode: registrationData.referralCode || '',
    },
    mode: 'onChange', // Validate on change for real-time feedback
  });

  // Watch form values to determine if all required fields are filled
  const fullName = form.watch('fullName');
  const username = form.watch('username');
  const referralCode = form.watch('referralCode');

  const isFormValid = form.formState.isValid;
  const isFormComplete = !!fullName && !!username && referralAnswer !== null &&
    (referralAnswer === 'no' || (
      referralAnswer === 'yes' && !!referralCode
    ));

  // Handle selecting a suggested username
  const handleSelectUsername = (selectedUsername: string) => {
    form.setValue('username', selectedUsername);
    form.clearErrors('username');
    setUsernameSuggestions([]); // Clear suggestions after selection
    setHasGeneratedSuggestions(false); // Reset the flag
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
      console.log('Clearing username suggestions because username changed and no errors');
      setUsernameSuggestions([]);
    }

    if (!username || username.length < 3) return;

    // Skip the check if we've already generated suggestions for this username
    if (hasGeneratedSuggestions && form.formState.errors.username) {
      console.log('Skipping username check because suggestions were already generated');
      return;
    }

    // Set a loading state for the username field
    const usernameField = document.querySelector('input[name="username"]');
    if (usernameField) {
      usernameField.classList.add('checking');
    }

    const timer = setTimeout(async () => {
      try {
        const response = await authApi.checkUsername(username);

        // If the check was not successful, show a warning but don't block the field
        if (!response.success) {
          console.warn('Username check failed:', response.message);
          // We don't set an error here to allow the user to continue typing
        }
        // If the username exists, show an error and generate suggestions
        else if (response.data?.exists) {
          console.log('Username already taken, generating suggestions');

          form.setError('username', {
            type: 'manual',
            message: 'This username is already taken. Please choose a different one.'
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
                console.warn('Cannot generate username suggestions: fullName is empty');
                setIsGeneratingSuggestions(false);
                return;
              }

              console.log('Automatically generating username suggestions for:', fullName);
              const suggestionsResponse = await authApi.generateUsernames(fullName);
              console.log('Username suggestions response:', suggestionsResponse);

              if (suggestionsResponse.success && suggestionsResponse.data?.usernames.length) {
                console.log('Setting username suggestions:', suggestionsResponse.data.usernames);

                // Set the suggestions
                setUsernameSuggestions(suggestionsResponse.data.usernames);

                // Show a toast with the suggestions
                toast.info('Username suggestions available', {
                  description: 'We\'ve generated some username suggestions for you below.',
                });
              }
            } catch (suggestionError) {
              console.error('Error generating username suggestions:', suggestionError);
            } finally {
              setIsGeneratingSuggestions(false);
            }
          }
        } else {
          // Clear any existing errors if the username is available
          form.clearErrors('username');
          // Clear any suggestions
          setUsernameSuggestions([]);
          // Reset the flag
          setHasGeneratedSuggestions(false);
        }
      } catch (error) {
        console.error('Error checking username:', error);
        // We don't set an error here to allow the user to continue typing
      } finally {
        // Remove loading state
        if (usernameField) {
          usernameField.classList.remove('checking');
        }
      }
    }, 800); // 800ms debounce

    return () => {
      clearTimeout(timer);
      // Remove loading state on cleanup
      if (usernameField) {
        usernameField.classList.remove('checking');
      }
    };
  }, [username, form, fullName, hasGeneratedSuggestions]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Check if the username is already taken
      const usernameCheckResponse = await authApi.checkUsername(values.username);

      // If the check was not successful (network error, server down, etc.), prevent proceeding
      if (!usernameCheckResponse.success) {
        toast.error('Unable to verify username availability', {
          description: usernameCheckResponse.message || 'Please check your connection and try again.',
        });
        form.setError('username', {
          type: 'manual',
          message: 'Unable to verify if this username is available. Please try again.'
        });
        return;
      }

      // If the username exists, show error (suggestions will be generated automatically)
      if (usernameCheckResponse.data?.exists) {
        toast.error('Username already taken', {
          description: 'Please choose a different username or select one of our suggestions.',
        });
        form.setError('username', {
          type: 'manual',
          message: 'This username is already taken. Please choose a different one.'
        });

        // Only generate suggestions if we haven't already done so
        if (!hasGeneratedSuggestions) {
          setHasGeneratedSuggestions(true);

          // Generate username suggestions
          setUsernameSuggestions([]);
          setIsGeneratingSuggestions(true);

          try {
            console.log('Generating username suggestions on submit for:', values.fullName);
            const suggestionsResponse = await authApi.generateUsernames(values.fullName);

            if (suggestionsResponse.success && suggestionsResponse.data?.usernames.length) {
              setUsernameSuggestions(suggestionsResponse.data.usernames);

              toast.info('Username suggestions available', {
                description: 'We\'ve generated some username suggestions for you below.',
              });
            }
          } catch (error) {
            console.error('Error generating username suggestions:', error);
          } finally {
            setIsGeneratingSuggestions(false);
          }
        }

        return;
      }

      // Update registration data
      const updateData: Partial<RegistrationData> = {
        fullName: values.fullName,
        username: values.username,
        wasReferred: referralAnswer === 'yes',
      };

      // Add referral information if user was referred
      if (referralAnswer === 'yes') {
        updateData.referralCode = values.referralCode;
      }

      updateRegistrationData(updateData);

      // Move to the next step
      onNext();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error checking username', {
        description: 'Unable to verify username availability. Please check your connection and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-1">Let's Get Started...</h2>
        <p className="text-gray-600 text-sm">
          Did someone refer you?
        </p>
      </div>

      <div className="flex justify-center space-x-4 mb-6">
        <AnimatedButton
          type="button"
          className="h-12 w-full"
          active={referralAnswer === 'yes'}
          onClick={() => setReferralAnswer('yes')}
          style={{ backgroundColor: referralAnswer === 'yes' ? 'black' : 'white', color: referralAnswer === 'yes' ? 'white' : 'black', borderColor: 'black', borderWidth: '1px' }}
        >
          YES
        </AnimatedButton>
        <AnimatedButton
          type="button"
          className="h-12 w-full"
          active={referralAnswer === 'no'}
          onClick={() => setReferralAnswer('no')}
          style={{ backgroundColor: referralAnswer === 'no' ? 'black' : 'white', color: referralAnswer === 'no' ? 'white' : 'black', borderColor: 'black', borderWidth: '1px' }}
        >
          NO
        </AnimatedButton>
      </div>

      <div className="text-sm  mb-4 text-center text-muted-foreground">
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
                    className={`rounded-md ${
                      fullName ? (form.formState.errors.fullName ? 'border-red-300' : 'border-green-300') : ''
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
                    className={`rounded-md ${
                      username ? (form.formState.errors.username ? 'border-red-300' : 'border-green-300') : ''
                    }`}
                  />
                </FormControl>
                <FormMessage />

                {/* Username suggestions */}
                {/* Debug info */}
                {(() => {
                  console.log('Rendering username suggestions section:', {
                    usernameSuggestionsLength: usernameSuggestions.length,
                    isGeneratingSuggestions,
                    shouldShow: usernameSuggestions.length > 0 || isGeneratingSuggestions
                  });
                  return null;
                })()}
                {/* Username suggestions dialog */}
                <UsernameSuggestionsDialog
                  suggestions={usernameSuggestions}
                  onSelect={handleSelectUsername}
                  onClose={() => setUsernameSuggestions([])}
                  isLoading={isGeneratingSuggestions}
                  open={usernameSuggestions.length > 0 || isGeneratingSuggestions}
                />
              </FormItem>
            )}
          />

          {/* Referral field - only shown when "Yes" is selected */}
          {referralAnswer === 'yes' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
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
                        className="rounded-md"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          )}

          <div className="flex justify-between pt-4">
            <BackButton
              onClick={onPrev}
              className="px-[2rem]"
            />
            <div>
              <AnimatedButton
                type="submit"
                className="h-12 px-10"
                active={isFormValid && isFormComplete}
                disabled={isLoading || !isFormValid || !isFormComplete}
              >
                {isFormComplete ? 'Continue' : 'Complete Form'}
              </AnimatedButton>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
