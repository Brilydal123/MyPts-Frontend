'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { parsePhoneNumberFromString, getCountryCallingCode, AsYouType, CountryCode } from 'libphonenumber-js';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Country data with flags, names, and codes
const countries = [
  { name: 'Afghanistan', code: 'AF', flag: '🇦🇫' },
  { name: 'Albania', code: 'AL', flag: '🇦🇱' },
  { name: 'Algeria', code: 'DZ', flag: '🇩🇿' },
  { name: 'Andorra', code: 'AD', flag: '🇦🇩' },
  { name: 'Angola', code: 'AO', flag: '🇦🇴' },
  { name: 'Antigua and Barbuda', code: 'AG', flag: '🇦🇬' },
  { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
  { name: 'Armenia', code: 'AM', flag: '🇦🇲' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  { name: 'Austria', code: 'AT', flag: '🇦🇹' },
  { name: 'Azerbaijan', code: 'AZ', flag: '🇦🇿' },
  { name: 'Bahamas', code: 'BS', flag: '�🇸' },
  { name: 'Bahrain', code: 'BH', flag: '🇧🇭' },
  { name: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
  { name: 'Barbados', code: 'BB', flag: '🇧🇧' },
  { name: 'Belarus', code: 'BY', flag: '🇧🇾' },
  { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
  { name: 'Belize', code: 'BZ', flag: '🇧🇿' },
  { name: 'Benin', code: 'BJ', flag: '🇧🇯' },
  { name: 'Bhutan', code: 'BT', flag: '🇧🇹' },
  { name: 'Bolivia', code: 'BO', flag: '🇧🇴' },
  { name: 'Bosnia and Herzegovina', code: 'BA', flag: '🇧🇦' },
  { name: 'Botswana', code: 'BW', flag: '🇧🇼' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
  { name: 'Brunei', code: 'BN', flag: '🇧🇳' },
  { name: 'Bulgaria', code: 'BG', flag: '��🇬' },
  { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫' },
  { name: 'Burundi', code: 'BI', flag: '🇧🇮' },
  { name: 'Cambodia', code: 'KH', flag: '🇰🇭' },
  { name: 'Cameroon', code: 'CM', flag: '🇨🇲' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦' },
  { name: 'Cape Verde', code: 'CV', flag: '🇨🇻' },
  { name: 'Central African Republic', code: 'CF', flag: '🇨🇫' },
  { name: 'Chad', code: 'TD', flag: '🇹🇩' },
  { name: 'Chile', code: 'CL', flag: '🇨🇱' },
  { name: 'China', code: 'CN', flag: '🇨🇳' },
  { name: 'Colombia', code: 'CO', flag: '🇨🇴' },
  { name: 'Comoros', code: 'KM', flag: '🇰🇲' },
  { name: 'Congo', code: 'CG', flag: '🇨🇬' },
  { name: 'Costa Rica', code: 'CR', flag: '🇨🇷' },
  { name: 'Croatia', code: 'HR', flag: '🇭🇷' },
  { name: 'Cuba', code: 'CU', flag: '🇨🇺' },
  { name: 'Cyprus', code: 'CY', flag: '🇨🇾' },
  { name: 'Czech Republic', code: 'CZ', flag: '🇨🇿' },
  { name: 'Denmark', code: 'DK', flag: '🇩🇰' },
  { name: 'Djibouti', code: 'DJ', flag: '🇩🇯' },
  { name: 'Dominica', code: 'DM', flag: '🇩🇲' },
  { name: 'Dominican Republic', code: 'DO', flag: '🇩🇴' },
  { name: 'East Timor', code: 'TL', flag: '🇹🇱' },
  { name: 'Ecuador', code: 'EC', flag: '🇪🇨' },
  { name: 'Egypt', code: 'EG', flag: '🇪🇬' },
  { name: 'El Salvador', code: 'SV', flag: '🇸🇻' },
  { name: 'Equatorial Guinea', code: 'GQ', flag: '🇬🇶' },
  { name: 'Eritrea', code: 'ER', flag: '🇪🇷' },
  { name: 'Estonia', code: 'EE', flag: '🇪🇪' },
  { name: 'Ethiopia', code: 'ET', flag: '🇪🇹' },
  { name: 'Fiji', code: 'FJ', flag: '🇫🇯' },
  { name: 'Finland', code: 'FI', flag: '🇫🇮' },
  { name: 'France', code: 'FR', flag: '🇫🇷' },
  { name: 'Gabon', code: 'GA', flag: '🇬🇦' },
  { name: 'Gambia', code: 'GM', flag: '🇬🇲' },
  { name: 'Georgia', code: 'GE', flag: '🇬�' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
  { name: 'Greece', code: 'GR', flag: '�🇷' },
  { name: 'Grenada', code: 'GD', flag: '🇬🇩' },
  { name: 'Guatemala', code: 'GT', flag: '🇬🇹' },
  { name: 'Guinea', code: 'GN', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', code: 'GW', flag: '🇬🇼' },
  { name: 'Guyana', code: 'GY', flag: '🇬🇾' },
  { name: 'Haiti', code: 'HT', flag: '🇭🇹' },
  { name: 'Honduras', code: 'HN', flag: '🇭🇳' },
  { name: 'Hungary', code: 'HU', flag: '🇭🇺' },
  { name: 'Iceland', code: 'IS', flag: '🇮🇸' },
  { name: 'India', code: 'IN', flag: '🇮🇳' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
  { name: 'Iran', code: 'IR', flag: '🇮🇷' },
  { name: 'Iraq', code: 'IQ', flag: '🇮🇶' },
  { name: 'Ireland', code: 'IE', flag: '🇮🇪' },
  { name: 'Israel', code: 'IL', flag: '🇮🇱' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹' },
  { name: 'Jamaica', code: 'JM', flag: '��' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵' },
  { name: 'Jordan', code: 'JO', flag: '🇯🇴' },
  { name: 'Kazakhstan', code: 'KZ', flag: '🇰🇿' },
  { name: 'Kenya', code: 'KE', flag: '🇰🇪' },
  { name: 'Kiribati', code: 'KI', flag: '🇰�' },
  { name: 'North Korea', code: 'KP', flag: '🇰�🇵' },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷' },
  { name: 'Kuwait', code: 'KW', flag: '🇰🇼' },
  { name: 'Kyrgyzstan', code: 'KG', flag: '🇰🇬' },
  { name: 'Laos', code: 'LA', flag: '🇱🇦' },
  { name: 'Latvia', code: 'LV', flag: '🇱🇻' },
  { name: 'Lebanon', code: 'LB', flag: '🇱🇧' },
  { name: 'Lesotho', code: 'LS', flag: '🇱🇸' },
  { name: 'Liberia', code: 'LR', flag: '🇱🇷' },
  { name: 'Libya', code: 'LY', flag: '🇱🇾' },
  { name: 'Liechtenstein', code: 'LI', flag: '🇱🇮' },
  { name: 'Lithuania', code: 'LT', flag: '🇱🇹' },
  { name: 'Luxembourg', code: 'LU', flag: '🇱🇺' },
  { name: 'Macedonia', code: 'MK', flag: '🇲🇰' },
  { name: 'Madagascar', code: 'MG', flag: '🇲🇬' },
  { name: 'Malawi', code: 'MW', flag: '🇲🇼' },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾' },
  { name: 'Maldives', code: 'MV', flag: '🇲🇻' },
  { name: 'Mali', code: 'ML', flag: '🇲🇱' },
  { name: 'Malta', code: 'MT', flag: '🇲🇹' },
  { name: 'Marshall Islands', code: 'MH', flag: '🇲🇭' },
  { name: 'Mauritania', code: 'MR', flag: '�🇷' },
  { name: 'Mauritius', code: 'MU', flag: '🇲🇺' },
  { name: 'Mexico', code: 'MX', flag: '🇲🇽' },
  { name: 'Micronesia', code: 'FM', flag: '🇫🇲' },
  { name: 'Moldova', code: 'MD', flag: '🇲🇩' },
  { name: 'Monaco', code: 'MC', flag: '🇲🇨' },
  { name: 'Mongolia', code: 'MN', flag: '🇲🇳' },
  { name: 'Montenegro', code: 'ME', flag: '🇲🇪' },
  { name: 'Morocco', code: 'MA', flag: '🇲🇦' },
  { name: 'Mozambique', code: 'MZ', flag: '🇲🇿' },
  { name: 'Myanmar', code: 'MM', flag: '🇲🇲' },
  { name: 'Namibia', code: 'NA', flag: '🇳🇦' },
  { name: 'Nauru', code: 'NR', flag: '🇳🇷' },
  { name: 'Nepal', code: 'NP', flag: '🇳🇵' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
  { name: 'Nicaragua', code: 'NI', flag: '🇳🇮' },
  { name: 'Niger', code: 'NE', flag: '🇳�' },
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
  { name: 'Norway', code: 'NO', flag: '🇳🇴' },
  { name: 'Oman', code: 'OM', flag: '🇴🇲' },
  { name: 'Pakistan', code: 'PK', flag: '🇵🇰' },
  { name: 'Palau', code: 'PW', flag: '🇵🇼' },
  { name: 'Panama', code: 'PA', flag: '🇵🇦' },
  { name: 'Papua New Guinea', code: 'PG', flag: '🇵🇬' },
  { name: 'Paraguay', code: 'PY', flag: '🇵🇾' },
  { name: 'Peru', code: 'PE', flag: '�🇪' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭' },
  { name: 'Poland', code: 'PL', flag: '🇵🇱' },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
  { name: 'Qatar', code: 'QA', flag: '🇶🇦' },
  { name: 'Romania', code: 'RO', flag: '🇷🇴' },
  { name: 'Russia', code: 'RU', flag: '🇷🇺' },
  { name: 'Rwanda', code: 'RW', flag: '🇷🇼' },
  { name: 'Saint Kitts and Nevis', code: 'KN', flag: '🇰🇳' },
  { name: 'Saint Lucia', code: 'LC', flag: '🇱🇨' },
  { name: 'Saint Vincent and the Grenadines', code: 'VC', flag: '🇻🇨' },
  { name: 'Samoa', code: 'WS', flag: '🇼🇸' },
  { name: 'San Marino', code: 'SM', flag: '🇸🇲' },
  { name: 'Sao Tome and Principe', code: 'ST', flag: '��' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
  { name: 'Senegal', code: 'SN', flag: '🇸🇳' },
  { name: 'Serbia', code: 'RS', flag: '🇷🇸' },
  { name: 'Seychelles', code: 'SC', flag: '🇸🇨' },
  { name: 'Sierra Leone', code: 'SL', flag: '��' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
  { name: 'Slovakia', code: 'SK', flag: '🇸🇰' },
  { name: 'Slovenia', code: 'SI', flag: '🇸🇮' },
  { name: 'Solomon Islands', code: 'SB', flag: '🇸🇧' },
  { name: 'Somalia', code: 'SO', flag: '🇸🇴' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
  { name: 'South Sudan', code: 'SS', flag: '🇸🇸' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸' },
  { name: 'Sri Lanka', code: 'LK', flag: '��🇰' },
  { name: 'Sudan', code: 'SD', flag: '🇸�' },
  { name: 'Suriname', code: 'SR', flag: '🇸🇷' },
  { name: 'Swaziland', code: 'SZ', flag: '🇸🇿' },
  { name: 'Sweden', code: 'SE', flag: '🇸�' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  { name: 'Syria', code: 'SY', flag: '🇸🇾' },
  { name: 'Taiwan', code: 'TW', flag: '🇹🇼' },
  { name: 'Tajikistan', code: 'TJ', flag: '��' },
  { name: 'Tanzania', code: 'TZ', flag: '�🇹🇿' },
  { name: 'Thailand', code: 'TH', flag: '��' },
  { name: 'Togo', code: 'TG', flag: '🇹🇬' },
  { name: 'Tonga', code: 'TO', flag: '🇹🇴' },
  { name: 'Trinidad and Tobago', code: 'TT', flag: '🇹🇹' },
  { name: 'Tunisia', code: 'TN', flag: '��🇳' },
  { name: 'Turkey', code: 'TR', flag: '🇹�' },
  { name: 'Turkmenistan', code: 'TM', flag: '🇹🇲' },
  { name: 'Tuvalu', code: 'TV', flag: '🇹🇻' },
  { name: 'Uganda', code: 'UG', flag: '🇺🇬' },
  { name: 'Ukraine', code: 'UA', flag: '🇺🇦' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  { name: 'United States', code: 'US', flag: '🇺🇸' },
  { name: 'Uruguay', code: 'UY', flag: '🇺🇾' },
  { name: 'Uzbekistan', code: 'UZ', flag: '🇺🇿' },
  { name: 'Vanuatu', code: 'VU', flag: '🇻🇺' },
  { name: 'Vatican City', code: 'VA', flag: '🇻🇦' },
  { name: 'Venezuela', code: 'VE', flag: '🇻🇪' },
  { name: 'Vietnam', code: 'VN', flag: '🇻🇳' },
  { name: 'Yemen', code: 'YE', flag: '🇾🇪' },
  { name: 'Zambia', code: 'ZM', flag: '🇿🇲' },
  { name: 'Zimbabwe', code: 'ZW', flag: '🇿🇼' },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  initialCountry?: string; // Country name to initialize with
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "Enter phone number",
  className,
  disabled = false,
  initialCountry,
}: PhoneInputProps) {
  // Find the initial country by name or default to US
  const findInitialCountry = () => {
    if (initialCountry) {
      const country = countries.find(c => c.name === initialCountry);
      if (country) return country;
    }
    return countries.find(c => c.code === 'US') || countries[0];
  };

  const [selectedCountry, setSelectedCountry] = useState(findInitialCountry());
  const [phoneValue, setPhoneValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize phone value from props
  useEffect(() => {
    if (value) {
      const phoneNumber = parsePhoneNumberFromString(value);
      if (phoneNumber) {
        // Remove the country code from the display value
        setPhoneValue(phoneNumber.nationalNumber);

        // Set the country if we can detect it
        if (phoneNumber.country) {
          const country = countries.find(c => c.code === phoneNumber.country);
          if (country) {
            setSelectedCountry(country);
          }
        }
      } else {
        setPhoneValue(value);
      }
    }
  }, []);

  // Update selected country when initialCountry changes
  useEffect(() => {
    if (initialCountry) {
      const country = countries.find(c => c.name === initialCountry);
      if (country && country.code !== selectedCountry.code) {
        setSelectedCountry(country);

        // Update the phone number format with the new country code
        if (phoneValue) {
          try {
            const fullNumber = `+${getCountryCallingCode(country.code as CountryCode)} ${phoneValue}`;
            onChange(fullNumber);
          } catch (error) {
            // Just keep the current value if there's an error
          }
        }
      }
    }
  }, [initialCountry]);

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

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Use AsYouType formatter to format the number as the user types
    const formatter = new AsYouType(selectedCountry.code as CountryCode);
    const formatted = formatter.input(input);

    setPhoneValue(formatted);

    // Create the full international number for the onChange handler
    try {
      const fullNumber = `+${getCountryCallingCode(selectedCountry.code as CountryCode)} ${formatted}`;
      onChange(fullNumber);

      // Try to detect country from the number
      const phoneNumber = parsePhoneNumberFromString(fullNumber);
      if (phoneNumber?.country && phoneNumber.country !== selectedCountry.code) {
        const country = countries.find(c => c.code === phoneNumber.country);
        if (country) {
          setSelectedCountry(country);
        }
      }
    } catch (error) {
      onChange(formatted);
    }
  };

  // Handle country selection
  const handleCountrySelect = (country: typeof countries[0]) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    setSearchTerm('');

    // Update the full number with the new country code
    try {
      const fullNumber = `+${getCountryCallingCode(country.code as CountryCode)} ${phoneValue}`;
      onChange(fullNumber);
    } catch (error) {
      // Just keep the current value if there's an error
    }
  };

  // Filter countries based on search term
  const filteredCountries = searchTerm
    ? countries.filter(country => {
        const searchLower = searchTerm.toLowerCase();
        const nameLower = country.name.toLowerCase();
        const codeLower = country.code.toLowerCase();
        const callingCode = getCountryCallingCode(country.code as CountryCode);

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
    : countries;

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled}
          className={cn(
            "flex items-center justify-center h-12 px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md transition-colors hover:bg-gray-200",
            showDropdown ? "bg-gray-200" : "",
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
        <Input
          type="tel"
          value={phoneValue}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          disabled={disabled}
          className="h-12 px-4 rounded-none rounded-r-md"
        />
      </div>

      {/* Country dropdown - appears upward */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bottom-full mb-1 w-full max-h-[300px] overflow-hidden bg-white border border-gray-300 rounded-md shadow-lg"
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
                    "w-full flex items-center px-4 py-2.5 text-left hover:bg-gray-100 transition-colors duration-150",
                    selectedCountry.code === country.code ? "bg-gray-100 font-medium" : ""
                  )}
                >
                  <span className="text-lg mr-3 flex-shrink-0">{country.flag}</span>
                  <span className="flex-1 truncate">{country.name}</span>
                  <span className="text-sm text-gray-500 font-mono ml-2">+{getCountryCallingCode(country.code as CountryCode)}</span>
                  {selectedCountry.code === country.code && (
                    <Check className="ml-2 h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
