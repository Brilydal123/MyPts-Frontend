'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { FormControl } from '@/components/ui/form';
import { CreditCard } from 'lucide-react';

interface CreditCardInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function CreditCardInput({
  value,
  onChange,
  onBlur,
  name,
  placeholder = '4242 4242 4242 4242',
  disabled = false,
  error = false,
  className = ''
}: CreditCardInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Format the card number with spaces
  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Add a space after every 4 digits
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');

    return formatted;
  };

  // Update the display value when the actual value changes
  useEffect(() => {
    setDisplayValue(formatCardNumber(value));
  }, [value]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Format the input for display
    const formatted = formatCardNumber(input);
    setDisplayValue(formatted);

    // Pass only the digits to the parent component
    onChange(input.replace(/\D/g, ''));
  };

  // Validate card type and return appropriate icon/style
  const getCardType = (cardNumber: string) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');

    // Visa: Starts with 4
    if (/^4/.test(cleanNumber)) {
      return 'visa';
    }

    // Mastercard: Starts with 51-55 or 2221-2720
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[0-1]|2720)/.test(cleanNumber)) {
      return 'mastercard';
    }

    // Amex: Starts with 34 or 37
    if (/^3[47]/.test(cleanNumber)) {
      return 'amex';
    }

    // Discover: Starts with 6011, 622126-622925, 644-649, or 65
    if (/^(6011|622(12[6-9]|1[3-9]|[2-8]|9[0-1][0-9]|92[0-5])|64[4-9]|65)/.test(cleanNumber)) {
      return 'discover';
    }

    return 'unknown';
  };

  const cardType = getCardType(displayValue);

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
          className={`pl-10 ${error ? 'border-red-500' : ''} ${cardType !== 'unknown' && displayValue ? 'border-green-500' : ''} ${className}`}
          maxLength={19} // 16 digits + 3 spaces
        />
      </FormControl>
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <CreditCard className="h-4 w-4" />
      </div>
      {cardType !== 'unknown' && displayValue && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs font-medium">
          {cardType === 'visa' && <span className="text-blue-600">Visa</span>}
          {cardType === 'mastercard' && <span className="text-red-600">Mastercard</span>}
          {cardType === 'amex' && <span className="text-blue-800">Amex</span>}
          {cardType === 'discover' && <span className="text-orange-600">Discover</span>}
        </div>
      )}
    </div>
  );
}
