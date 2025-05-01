'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VerificationCodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  error?: boolean;
  className?: string;
}

export function VerificationCodeInput({
  length = 6,
  onComplete,
  error = false,
  className,
}: VerificationCodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [shake, setShake] = useState(false);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Trigger shake animation when error prop changes to true
  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    // Only accept single digits
    if (!/^\d*$/.test(value)) return;

    // Update the code array
    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take the last character if multiple are pasted
    setCode(newCode);

    // If a digit was entered, move to the next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if the code is complete
    if (newCode.every(digit => digit !== '') && !newCode.includes('')) {
      onComplete(newCode.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Move to next input on right arrow
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Move to previous input on left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();

    // Only accept digits
    if (!/^\d+$/.test(pastedData)) return;

    // Fill the code array with the pasted digits
    const newCode = [...code];
    for (let i = 0; i < Math.min(length, pastedData.length); i++) {
      newCode[i] = pastedData[i];
    }

    setCode(newCode);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex(digit => digit === '');
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[length - 1]?.focus();
    }

    // Check if the code is complete
    if (newCode.every(digit => digit !== '') && !newCode.includes('')) {
      onComplete(newCode.join(''));
    }
  };

  return (
    <motion.div
      className={cn("flex justify-center gap-2 md:gap-4", className)}
      animate={shake ? { x: [-10, 10, -10, 10, -5, 5, -2, 2, 0] } : {}}
      transition={{ duration: 0.5 }}
    >
      {Array.from({ length }).map((_, index) => (
        <div key={index} className="relative">
          <input
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={code[index]}
            onChange={e => handleChange(e, index)}
            onKeyDown={e => handleKeyDown(e, index)}
            onPaste={handlePaste}
            className={cn(
              "w-12 h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-bold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all",
              error
                ? "border-red-500 focus:ring-red-500 bg-red-50"
                : code[index]
                  ? "border-green-500 focus:ring-green-500 bg-green-50"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            )}
            aria-label={`Digit ${index + 1}`}
          />
        </div>
      ))}
    </motion.div>
  );
}
