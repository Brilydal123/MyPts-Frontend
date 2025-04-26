'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { FormControl } from '@/components/ui/form';
import { Calendar } from 'lucide-react';

interface ExpiryDateInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}

export function ExpiryDateInput({
  value,
  onChange,
  onBlur,
  name,
  placeholder = 'MM/YY',
  disabled = false,
  error = false
}: ExpiryDateInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Format the expiry date with a slash
  const formatExpiryDate = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add a slash after the first 2 digits
    if (digits.length > 2) {
      return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
    }
    
    return digits;
  };

  // Update the display value when the actual value changes
  useEffect(() => {
    setDisplayValue(formatExpiryDate(value));
  }, [value]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Format the input for display
    const formatted = formatExpiryDate(input);
    setDisplayValue(formatted);
    
    // Pass only the digits to the parent component
    onChange(input.replace(/\D/g, ''));
  };

  // Validate expiry date
  const isValidExpiryDate = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    
    if (cleanValue.length !== 4) {
      return false;
    }
    
    const month = parseInt(cleanValue.substring(0, 2), 10);
    const year = parseInt(cleanValue.substring(2, 4), 10);
    
    // Check if month is valid (1-12)
    if (month < 1 || month > 12) {
      return false;
    }
    
    // Get current date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits of year
    const currentMonth = currentDate.getMonth() + 1; // January is 0
    
    // Check if the card is not expired
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return false;
    }
    
    return true;
  };

  const isValid = displayValue.length === 5 && isValidExpiryDate(displayValue);

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
          className={`pl-10 ${error ? 'border-red-500' : ''} ${isValid ? 'border-green-500' : ''}`}
          maxLength={5} // MM/YY format
        />
      </FormControl>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <Calendar className="h-4 w-4" />
      </div>
    </div>
  );
}
