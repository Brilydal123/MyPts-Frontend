'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { FormControl } from '@/components/ui/form';
import { ShieldCheck } from 'lucide-react';

interface CVCInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export function CVCInput({
  value,
  onChange,
  onBlur,
  name,
  placeholder = '123',
  disabled = false,
  error = false
}: CVCInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Update the display value when the actual value changes
  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Only allow digits
    const digits = input.replace(/\D/g, '');
    
    setDisplayValue(digits);
    onChange(digits);
  };

  // Validate CVC
  const isValidCVC = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    
    // CVC should be 3 or 4 digits
    return cleanValue.length >= 3 && cleanValue.length <= 4;
  };

  const isValid = isValidCVC(displayValue);

  return (
    <div className="relative">
      <FormControl>
        <Input
          type="text"
          inputMode="numeric"
          name={name}
          value={displayValue}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`pl-10 ${error ? 'border-red-500' : ''} ${isValid && displayValue ? 'border-green-500' : ''}`}
          maxLength={4}
        />
      </FormControl>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <ShieldCheck className="h-4 w-4" />
      </div>
    </div>
  );
}
