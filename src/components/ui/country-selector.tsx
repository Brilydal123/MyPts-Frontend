'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Import the countries data from the shared file
import { countries } from './country-selector-data';

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CountrySelector({
  value,
  onChange,
  placeholder = "Select Country",
  className,
  disabled = false,
}: CountrySelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find the selected country object
  const selectedCountry = countries.find(country => country.name === value) || null;

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

  // Handle country selection
  const handleCountrySelect = (country: typeof countries[0]) => {
    onChange(country.name);
    setShowDropdown(false);
    setSearchTerm('');
  };

  // Filter countries based on search term
  const filteredCountries = searchTerm
    ? countries.filter(country => {
      const searchLower = searchTerm.toLowerCase();
      const nameLower = country.name.toLowerCase();
      const codeLower = country.code.toLowerCase();

      // Check if search term is in the country name
      if (nameLower.includes(searchLower)) return true;

      // Check if search term is in the country code
      if (codeLower.includes(searchLower)) return true;

      return false;
    })
    : countries;

  return (
    <div className={cn("relative", className)}>
      {/* Country selector button */}
      <button
        type="button"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between w-full h-12 px-4 py-2 text-left bg-white border border-gray-300 rounded-md transition-colors hover:bg-gray-50",
          showDropdown ? "ring-2 ring-blue-500 ring-opacity-50" : "",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center">
          {selectedCountry ? (
            <>
              <span className="text-lg mr-2">{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-70 transition-transform duration-200",
          showDropdown ? "transform rotate-180" : ""
        )} />
      </button>

      {/* Country dropdown - appears upward */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 bottom-full left-0 right-0 mb-1 bg-white border border-gray-300 rounded-md shadow-lg"
          style={{ maxHeight: '300px' }}
        >
          {/* Search input */}
          <div className="sticky top-0 p-2 border-b border-gray-200 bg-white z-10">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-8"
              />
            </div>
          </div>

          {/* Country list */}
          <div className="overflow-y-auto" style={{ maxHeight: '250px' }}>
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No countries found</div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={cn(
                    "w-full flex items-center px-4 py-2 text-left hover:bg-gray-100 transition-colors duration-150",
                    selectedCountry?.code === country.code ? "bg-blue-50" : ""
                  )}
                >
                  <span className="text-lg mr-3 flex-shrink-0">{country.flag}</span>
                  <span className="flex-1 truncate">{country.name}</span>
                  {selectedCountry?.code === country.code && (
                    <Check className="ml-2 h-4 w-4 text-blue-500 flex-shrink-0" />
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
