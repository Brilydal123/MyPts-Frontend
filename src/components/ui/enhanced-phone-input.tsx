'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
  parsePhoneNumberFromString,
  getCountryCallingCode,
  AsYouType,
  CountryCode,
  isValidPhoneNumber,
  getExampleNumber
} from 'libphonenumber-js/max';
import examples from 'libphonenumber-js/mobile/examples';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Import the countries data from the country-selector component
import { countries as allCountries } from './country-selector-data';

// Use the imported countries array as our data source
const allCountriesData = [...allCountries];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidityChange?: (isValid: boolean) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  initialCountry?: string; // Country name to initialize with
}

export function EnhancedPhoneInput({
  value,
  onChange,
  onValidityChange,
  placeholder = "Enter phone number",
  className,
  disabled = false,
  initialCountry,
}: PhoneInputProps) {
  // Find the initial country by name or default to US
  const findInitialCountry = () => {
    if (initialCountry) {
      const country = allCountriesData.find(c => c.name === initialCountry);
      if (country) return country;
    }
    return allCountriesData.find(c => c.code === 'US') || allCountriesData[0];
  };

  const [selectedCountry, setSelectedCountry] = useState(findInitialCountry());
  const [phoneValue, setPhoneValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [formatHint, setFormatHint] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Get example number format for the selected country
  const getExampleFormat = useCallback((countryCode: string) => {
    try {
      const exampleNumber = getExampleNumber(countryCode as CountryCode, examples);
      if (exampleNumber) {
        return exampleNumber.formatNational();
      }
    } catch (error) {
      console.error('Error getting example format:', error);
    }
    return '';
  }, []);

  // Initialize phone value from props
  useEffect(() => {
    if (value) {
      const phoneNumber = parsePhoneNumberFromString(value);
      if (phoneNumber) {
        // Set the formatted national number
        setPhoneValue(phoneNumber.formatNational());

        // Set the country if we can detect it
        if (phoneNumber.country) {
          const country = allCountriesData.find(c => c.code === phoneNumber.country);
          if (country) {
            setSelectedCountry(country);
          }
        }

        // Check validity
        setIsValid(phoneNumber.isValid());
        if (onValidityChange) {
          onValidityChange(phoneNumber.isValid());
        }
      } else {
        setPhoneValue(value);
        setIsValid(false);
        if (onValidityChange) {
          onValidityChange(false);
        }
      }
    } else {
      setPhoneValue('');
      setIsValid(false);
      if (onValidityChange) {
        onValidityChange(false);
      }
    }

    // Set format hint
    setFormatHint(getExampleFormat(selectedCountry.code));
  }, []);

  // Update selected country when initialCountry changes
  useEffect(() => {
    if (initialCountry) {
      console.log("Initial country changed to:", initialCountry);
      const country = allCountriesData.find(c => c.name === initialCountry);
      if (country) {
        console.log("Found matching country:", country.name, country.code);
        setSelectedCountry(country);
        setFormatHint(getExampleFormat(country.code));

        // Update the phone number format with the new country code
        if (phoneValue) {
          try {
            const formatter = new AsYouType(country.code as CountryCode);
            const formatted = formatter.input(phoneValue);
            setPhoneValue(formatted);

            const fullNumber = `+${getCountryCallingCode(country.code as CountryCode)} ${formatted}`;
            onChange(fullNumber);

            // Validate the new number
            const isValidNumber = isValidPhoneNumber(fullNumber, country.code as CountryCode);
            setIsValid(isValidNumber);
            if (onValidityChange) {
              onValidityChange(isValidNumber);
            }
          } catch (error) {
            console.error("Error updating phone format:", error);
            // Just keep the current value if there's an error
          }
        }
      } else {
        console.warn("No matching country found for:", initialCountry);
      }
    }
  }, [initialCountry, getExampleFormat]);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showDropdown]);

  // State for error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setIsTouched(true);

    // Use AsYouType formatter to format the number as the user types
    const formatter = new AsYouType(selectedCountry.code as CountryCode);
    const formatted = formatter.input(input);

    setPhoneValue(formatted);

    // Create the full international number for the onChange handler
    try {
      const fullNumber = `+${getCountryCallingCode(selectedCountry.code as CountryCode)} ${formatted}`;
      onChange(fullNumber);

      // Parse the phone number for detailed validation
      const phoneNumber = parsePhoneNumberFromString(fullNumber);

      if (phoneNumber) {
        // Check if the number is valid for the country
        const isValidNumber = phoneNumber.isValid();

        // Set validity state
        setIsValid(isValidNumber);
        if (onValidityChange) {
          onValidityChange(isValidNumber);
        }

        // Check for specific validation issues
        if (!isValidNumber) {
          // Get the national number (without country code)
          const nationalNumber = phoneNumber.nationalNumber;

          // Get expected length for this country
          const example = getExampleNumber(selectedCountry.code as CountryCode, examples);
          const expectedLength = example ? example.nationalNumber.length : null;

          if (expectedLength) {
            if (nationalNumber.length < expectedLength) {
              setErrorMessage(`Number too short. Expected ${expectedLength} digits.`);
            } else if (nationalNumber.length > expectedLength) {
              setErrorMessage(`Number too long. Expected ${expectedLength} digits.`);
            } else {
              setErrorMessage("Invalid number format for this country.");
            }
          } else {
            setErrorMessage("Invalid phone number.");
          }
        } else {
          setErrorMessage(null);
        }

        // Try to detect country from the number
        if (phoneNumber.country && phoneNumber.country !== selectedCountry.code) {
          const country = allCountriesData.find(c => c.code === phoneNumber.country);
          if (country) {
            setSelectedCountry(country);
            setFormatHint(getExampleFormat(country.code));
          }
        }
      } else {
        setIsValid(false);
        setErrorMessage("Invalid phone number format.");
        if (onValidityChange) {
          onValidityChange(false);
        }
      }
    } catch (error) {
      onChange(formatted);
      setIsValid(false);
      setErrorMessage("Invalid phone number.");
      if (onValidityChange) {
        onValidityChange(false);
      }
    }
  };

  // Handle country selection
  const handleCountrySelect = (country: typeof allCountriesData[0]) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    setSearchTerm('');
    setFormatHint(getExampleFormat(country.code));
    setErrorMessage(null); // Reset error message when changing country

    // Update the full number with the new country code
    try {
      // Format the existing phone value with the new country code
      const formatter = new AsYouType(country.code as CountryCode);
      let nationalNumber = phoneValue;

      // Try to extract just the national number if it has a country code
      const parsedNumber = parsePhoneNumberFromString(phoneValue, selectedCountry.code as CountryCode);
      if (parsedNumber) {
        nationalNumber = parsedNumber.nationalNumber;
      }

      const formatted = formatter.input(nationalNumber);
      setPhoneValue(formatted);

      const fullNumber = `+${getCountryCallingCode(country.code as CountryCode)} ${formatted}`;
      onChange(fullNumber);

      // Validate the new number with detailed feedback
      const phoneNumber = parsePhoneNumberFromString(fullNumber);
      if (phoneNumber) {
        const isValidNumber = phoneNumber.isValid();
        setIsValid(isValidNumber);

        if (onValidityChange) {
          onValidityChange(isValidNumber);
        }

        // Check for specific validation issues
        if (!isValidNumber && phoneValue.length > 0) {
          // Get the national number (without country code)
          const nationalNumber = phoneNumber.nationalNumber;

          // Get expected length for this country
          const example = getExampleNumber(country.code as CountryCode, examples);
          const expectedLength = example ? example.nationalNumber.length : null;

          if (expectedLength) {
            if (nationalNumber.length < expectedLength) {
              setErrorMessage(`Number too short. Expected ${expectedLength} digits.`);
            } else if (nationalNumber.length > expectedLength) {
              setErrorMessage(`Number too long. Expected ${expectedLength} digits.`);
            } else {
              setErrorMessage("Invalid number format for this country.");
            }
          }
        }
      }
    } catch (error) {
      // Just keep the current value if there's an error
    }

    // Focus the phone input after selecting a country
    if (phoneInputRef.current) {
      phoneInputRef.current.focus();
    }
  };

  // Filter countries based on search term
  const filteredCountries = searchTerm
    ? allCountriesData.filter(country => {
      const searchLower = searchTerm.toLowerCase();
      const nameLower = country.name.toLowerCase();
      const codeLower = country.code.toLowerCase();
      let callingCode = '';

      try {
        callingCode = getCountryCallingCode(country.code as CountryCode);
      } catch (error) {
        // Ignore errors for invalid country codes
      }

      // Check if search term is in the country name
      if (nameLower.includes(searchLower)) return true;

      // Check if search term is in the country code
      if (codeLower.includes(searchLower)) return true;

      // Check if search term is in the calling code (with or without +)
      if (callingCode.includes(searchTerm) ||
        (searchTerm.startsWith('+') && callingCode.includes(searchTerm.substring(1))))
        return true;

      return false;
    })
    : allCountriesData;

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled}
          className={cn(
            "flex items-center justify-center h-12 px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-xl transition-colors hover:bg-gray-100",
            showDropdown ? "bg-gray-100" : "",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="text-lg mr-1.5">{selectedCountry.flag}</span>
          <span className="text-sm font-medium">+{getCountryCallingCode(selectedCountry.code as CountryCode)}</span>
          <ChevronDown className={cn(
            "ml-1 h-4 w-4 opacity-50 transition-transform duration-200",
            showDropdown ? "transform rotate-180" : ""
          )} />
        </button>

        {/* Phone number input */}
        <div className="relative flex-1">
          <Input
            ref={phoneInputRef}
            type="tel"
            value={phoneValue}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "h-12 px-4 rounded-none rounded-r-xl transition-colors",
              isTouched && (
                isValid
                  ? "border-green-500 focus-visible:ring-green-500"
                  : "border-red-300 focus-visible:ring-red-500"
              )
            )}
            onBlur={() => setIsTouched(true)}
          />

          {/* Validation icon */}
          {isTouched && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <AnimatePresence mode="wait">
                {isValid ? (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    key="valid"
                  >
                    <Check className="h-5 w-5 text-green-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    key="invalid"
                  >
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Error message or format hint */}
      {isTouched && !isValid && (
        <div className="text-xs mt-1 ml-1">
          {errorMessage ? (
            <span className="text-red-500">{errorMessage}</span>
          ) : formatHint ? (
            <span className="text-gray-500">Format example: {formatHint}</span>
          ) : null}
        </div>
      )}

      {/* Country dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            ref={dropdownRef}
            className="absolute z-50 top-full mt-1 w-full max-h-[300px] overflow-hidden bg-white border border-gray-300 rounded-xl shadow-lg"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search country or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Country list */}
            <div className="max-h-[250px] overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No countries found</div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      "w-full flex items-center px-4 py-2.5 text-left hover:bg-gray-50 transition-colors duration-150",
                      selectedCountry.code === country.code ? "bg-blue-50 font-medium" : ""
                    )}
                  >
                    <span className="text-lg mr-3 flex-shrink-0">{country.flag}</span>
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-sm text-gray-500 font-mono ml-2">+{getCountryCallingCode(country.code as CountryCode)}</span>
                    {selectedCountry.code === country.code && (
                      <Check className="ml-2 h-4 w-4 text-blue-500 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
