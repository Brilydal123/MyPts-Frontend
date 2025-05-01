'use client';

import React, { useState, forwardRef } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  className?: string;
  containerClassName?: string;
  icon?: React.ReactNode;
}

const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, error, className, containerClassName, icon, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    return (
      <div className={cn("relative", containerClassName)}>
        <div>

        </div>
        <div className="relative">
          {icon && (
            <div className='bg-gray-100 h-full w-[2.5rem] absolute
            rounded-l-md
            '>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500  z-10">
              {icon}
            </div>
            </div>
          )}

          <Input
            ref={ref}
            {...props}
            className={cn(
              "h-14 pb-2 transition-all duration-300 border-2",
              icon ? "pl-14 pr-4" : "px-4",
              error ? "border-red-500" : isFocused ? "border-black" : "border-gray-300",
              className
            )}
            placeholder=""
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
          />

          {/* Label - single element that animates between positions */}
          <span
            className={cn(
              "absolute px-1 pointer-events-none transition-all duration-300 ease-out",
              icon ? "left-10" : "left-3",
              isFocused || hasValue
                ? "top-0 text-xs font-medium -translate-y-1/2 bg-white z-10"
                : "top-1/2 -translate-y-1/2 text-base bg-transparent",
              isFocused
                ? "text-black"
                : hasValue
                  ? "text-gray-500"
                  : "text-gray-400"
            )}
            style={{
              transitionProperty: "top, font-size, transform, background-color, color"
            }}
          >
            {label}
          </span>
        </div>
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";

export { FloatingLabelInput };
