'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { BackButton } from '@/components/ui/back-button';
import { AnimatedButton } from '@/components/ui/animated-button';
import { motion } from 'framer-motion';
import { RegistrationData } from '../registration-flow';
import { toast } from 'sonner';
import { VerificationCodeInput } from '@/components/ui/verification-code-input';
import { authApi } from '@/lib/api/auth-api';
import { Loader2 } from 'lucide-react';

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
  verificationCode: z.string()
    .min(6, 'Verification code must be at least 6 characters')
    .max(6, 'Verification code must be exactly 6 characters'),
});

interface VerificationStepProps {
  registrationData: RegistrationData;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function VerificationStep({
  registrationData,
  updateRegistrationData,
  onNext,
  onPrev,
}: VerificationStepProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isResending, setIsResending] = useState(false);
  const [codeError, setCodeError] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      verificationCode: '',
    },
  });

  // Timer for OTP expiration
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // Get the verification method in lowercase as expected by the API
      const verificationMethod = registrationData.verificationMethod.toLowerCase() as 'email' | 'phone';

      // Get the userId from localStorage
      const userId = localStorage.getItem('registrationUserId');

      if (!userId) {
        throw new Error('User ID not found. Please restart the registration process.');
      }

      // Verify the OTP
      const response = await authApi.verifyOTP(
        userId,
        values.verificationCode,
        verificationMethod
      );

      if (!response.success) {
        setCodeError(true);
        throw new Error(response.message || 'Verification failed');
      }

      // Show success message
      toast.success('Account verified successfully!', {
        description: 'You can now log in with your credentials.',
      });

      // Clear registration data from localStorage
      localStorage.removeItem('registrationUserId');

      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Error:', error);
      setCodeError(true);
      toast.error('Verification failed', {
        description: error instanceof Error ? error.message : 'Please check your verification code and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeComplete = (code: string) => {
    form.setValue('verificationCode', code);
    // Reset error state when user enters a new code
    setCodeError(false);

    // Auto-submit when all 6 digits are entered
    if (code.length === 6) {
      form.handleSubmit(onSubmit)();
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      // Get the userId from localStorage
      const userId = localStorage.getItem('registrationUserId');

      if (!userId) {
        throw new Error('User ID not found. Please restart the registration process.');
      }

      // Make API call to resend verification code
      const response = await authApi.resendOTP(
        userId,
        registrationData.verificationMethod
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to resend verification code');
      }

      // Reset timer
      setTimeLeft(300);

      // Reset code error state
      setCodeError(false);

      // Clear any existing verification code
      form.setValue('verificationCode', '');

      // Show success message with OTP for development (remove in production)
      const otpMessage = response.data?.otp
        ? `New code: ${response.data.otp}`
        : `A new code has been sent to ${registrationData.verificationMethod === 'EMAIL' ? registrationData.email : registrationData.phoneNumber}`;

      toast.success('Verification code resent', {
        description: otpMessage,
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to resend code', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsResending(false);
    }
  };

  // Animation variants for the verification code input
  const inputVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        delay: 0.2
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-1">Verify Your Account</h2>
        <p className="text-gray-600 text-sm">
          We've sent a verification code to {registrationData.verificationMethod === 'EMAIL' ? registrationData.email : registrationData.phoneNumber}.
          Please enter it below to complete your registration.
        </p>
      </div>

      <motion.div
        initial="initial"
        animate="animate"
        variants={inputVariants}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="verificationCode"
              render={() => (
                <FormItem>
                  <FormControl>
                    <VerificationCodeInput
                      onComplete={handleCodeComplete}
                      error={codeError}
                    />
                  </FormControl>
                  <div className="mt-2 text-center">
                    <FormMessage className="text-center" />
                  </div>
                </FormItem>
              )}
            />

            <div className="text-center text-sm">
              <p className="text-gray-600">
                Code expires in <span className="font-semibold">{formatTime(timeLeft)}</span>
              </p>
            </div>

            <AnimatedButton
              type="submit"
              className="flex mx-auto h-12"
              style={{
                width: '100%',
                maxWidth: '120px',
                margin: '0 auto',
              }}
              active={form.formState.isValid}
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="whitespace-nowrap">Verifying<AnimatedEllipsis /></span>
                </span>
              ) : (
                'Verify'
              )}
            </AnimatedButton>
          </form>
        </Form>
      </motion.div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Didn't receive the code?{' '}
          <button
            onClick={handleResendCode}
            disabled={isResending || timeLeft > 270} // Disable for 30 seconds after sending
            className={`text-blue-600 hover:underline ${isResending || timeLeft > 270 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            {isResending ? (
              <span className="flex items-center">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                <span className="whitespace-nowrap">Resending<AnimatedEllipsis /></span>
              </span>
            ) : (
              'Resend Code'
            )}
          </button>
        </p>
      </div>

      <div className="mt-auto pt-6 mb-8">
        <BackButton
          onClick={onPrev}
          className="px-[2rem]"
        />
      </div>
    </div>
  );
}
