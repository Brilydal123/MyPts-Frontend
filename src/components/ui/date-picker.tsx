'use client';

import * as React from 'react';
import { format, getYear, getMonth, setYear, setMonth, isValid } from 'date-fns';
import { Calendar as CalendarIcon, X as CloseIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
// Dynamically import Lottie to ensure it only loads on the client side
const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minAge?: number;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
  disabled = false,
  minAge = 0,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<'calendar' | 'year' | 'month'>('calendar');
  const [yearInput, setYearInput] = React.useState('');
  const [monthInput, setMonthInput] = React.useState('');
  const [dayInput, setDayInput] = React.useState('');
  const [showCheckmark, setShowCheckmark] = React.useState(false);

  // Get current date for calculations
  const today = React.useMemo(() => new Date(), []);

  // Calculate minimum date for age validation
  const minDate = React.useMemo(() =>
    minAge > 0 ? new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate()) : undefined
    , [minAge, today]);

  // State for current view date (for year/month dropdowns)
  const [currentDate, setCurrentDate] = React.useState<Date>(() => value || today);

  // Generate years for dropdown (100 years back from current year)
  const years = React.useMemo(() => {
    const currentYear = today.getFullYear();
    return Array.from({ length: 100 }, (_, i) => currentYear - i);
  }, [today]);

  // Month names for dropdown
  const months = React.useMemo(() => [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ], []);

  // Initialize input fields when value changes
  React.useEffect(() => {
    if (value) {
      setYearInput(getYear(value).toString());
      setMonthInput((getMonth(value) + 1).toString().padStart(2, '0'));
      setDayInput(value.getDate().toString().padStart(2, '0'));
      setCurrentDate(value);

      // Show checkmark animation when value is set from outside
      setShowCheckmark(true);
      // Keep the checkmark visible - don't hide it
    } else {
      setYearInput('');
      setMonthInput('');
      setDayInput('');
    }
  }, [value]);

  // Handle direct input changes
  const handleInputChange = React.useCallback((type: 'year' | 'month' | 'day', inputValue: string) => {
    // Only allow numbers
    const numericValue = inputValue.replace(/\D/g, '');

    if (type === 'year') {
      setYearInput(numericValue.slice(0, 4));
    } else if (type === 'month') {
      const monthVal = numericValue.slice(0, 2);
      if (parseInt(monthVal) > 12 && monthVal.length === 2) {
        setMonthInput('12');
      } else {
        setMonthInput(monthVal);
      }
    } else if (type === 'day') {
      const dayVal = numericValue.slice(0, 2);
      if (parseInt(dayVal) > 31 && dayVal.length === 2) {
        setDayInput('31');
      } else {
        setDayInput(dayVal);
      }
    }
  }, []);

  // Update current view date when inputs change, but not the actual value
  const updateViewDate = React.useCallback(() => {
    if (yearInput && monthInput && dayInput) {
      const year = parseInt(yearInput);
      const month = parseInt(monthInput) - 1; // 0-based month
      const day = parseInt(dayInput);

      if (year && !isNaN(month) && day) {
        const newDate = new Date(year, month, day);

        // Validate the date is real (e.g., not Feb 31)
        if (isValid(newDate) && newDate.getDate() === day) {
          // Check age restriction
          if (minAge > 0 && minDate && newDate > minDate) {
            // Date doesn't meet age requirement, don't update
            return;
          }

          // Check future date restriction
          if (newDate > today) {
            // Future date, don't update
            return;
          }

          setCurrentDate(newDate);
        }
      }
    }
  }, [yearInput, monthInput, dayInput, minAge, minDate, today]);

  // Call updateViewDate when inputs change
  React.useEffect(() => {
    updateViewDate();
  }, [updateViewDate]);

  // Handle selection from calendar
  const handleSelect = React.useCallback((date: Date | undefined) => {
    onChange(date);
    setOpen(false);

    // Show checkmark animation
    if (date) {
      setShowCheckmark(true);
      // Keep the checkmark visible - don't hide it
    }
  }, [onChange]);

  // Handle year selection
  const handleYearSelect = React.useCallback((year: number) => {
    setCurrentDate(prevDate => {
      const newDate = setYear(prevDate, year);
      return newDate;
    });
    setView('month');
  }, []);

  // Handle month selection
  const handleMonthSelect = React.useCallback((monthIndex: number) => {
    setCurrentDate(prevDate => {
      const newDate = setMonth(prevDate, monthIndex);
      return newDate;
    });
    setView('calendar');
  }, []);

  // Apply date from direct input
  const applyInputDate = React.useCallback(() => {
    if (yearInput && monthInput && dayInput) {
      const year = parseInt(yearInput);
      const month = parseInt(monthInput) - 1; // 0-based month
      const day = parseInt(dayInput);

      if (year && !isNaN(month) && day) {
        const newDate = new Date(year, month, day);

        // Validate the date is real (e.g., not Feb 31)
        if (isValid(newDate) && newDate.getDate() === day) {
          // Check age restriction
          if (minAge > 0 && minDate && newDate > minDate) {
            // Date doesn't meet age requirement
            toast?.error(`You must be at least ${minAge} years old.`);
            return;
          }

          // Check future date restriction
          if (newDate > today) {
            // Future date
            toast?.error("Future dates are not allowed.");
            return;
          }

          onChange(newDate);
          setOpen(false);

          // Show checkmark animation
          setShowCheckmark(true);
          // Keep the checkmark visible - don't hide it
        }
      }
    }
  }, [yearInput, monthInput, dayInput, minAge, minDate, today, onChange]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  const slideVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
  };

  // Year grid for selection
  const YearGrid = React.useCallback(() => (
    <motion.div
      className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-3 max-h-[40vh] overflow-y-auto"
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <button
        className="col-span-3 sm:col-span-4 text-sm font-medium text-blue-500 hover:text-blue-700 mb-2"
        onClick={() => setView('calendar')}
        type="button"
      >
        Back to Calendar
      </button>
      {years.map((year) => (
        <button
          key={year}
          onClick={() => handleYearSelect(year)}
          className={cn(
            "py-2 px-3 rounded-full text-sm font-medium transition-all",
            getYear(currentDate) === year
              ? "bg-blue-500 text-white"
              : "hover:bg-gray-100"
          )}
          type="button"
        >
          {year}
        </button>
      ))}
    </motion.div>
  ), [years, currentDate, handleYearSelect, slideVariants]);

  // Month grid for selection
  const MonthGrid = React.useCallback(() => (
    <motion.div
      className="grid grid-cols-3 gap-2 p-3"
      variants={slideVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <button
        className="col-span-3 text-sm font-medium text-blue-500 hover:text-blue-700 mb-2"
        onClick={() => setView('year')}
        type="button"
      >
        Back to Year Selection
      </button>
      {months.map((month, index) => (
        <button
          key={month}
          onClick={() => handleMonthSelect(index)}
          className={cn(
            "py-2 px-3 rounded-full text-sm font-medium transition-all",
            getMonth(currentDate) === index
              ? "bg-blue-500 text-white"
              : "hover:bg-gray-100"
          )}
          type="button"
        >
          {month.substring(0, 3)}
        </button>
      ))}
    </motion.div>
  ), [months, currentDate, handleMonthSelect, slideVariants]);

  // Direct input component
  const DirectInput = React.useCallback(() => (
    <div className="flex flex-col sm:flex-row items-center gap-2 p-3 border-t">
      <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-2 w-full">
        <input
          type="text"
          value={monthInput}
          onChange={(e) => handleInputChange('month', e.target.value)}
          placeholder="MM"
          className="w-12 text-center bg-transparent border-none focus:outline-none text-sm"
          maxLength={2}
          inputMode="numeric"
        />
        <span className="text-gray-400">/</span>
        <input
          type="text"
          value={dayInput}
          onChange={(e) => handleInputChange('day', e.target.value)}
          placeholder="DD"
          className="w-12 text-center bg-transparent border-none focus:outline-none text-sm"
          maxLength={2}
          inputMode="numeric"
        />
        <span className="text-gray-400">/</span>
        <input
          type="text"
          value={yearInput}
          onChange={(e) => handleInputChange('year', e.target.value)}
          placeholder="YYYY"
          className="w-16 text-center bg-transparent border-none focus:outline-none text-sm"
          maxLength={4}
          inputMode="numeric"
        />
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full px-3 w-full sm:w-auto mt-2 sm:mt-0"
        onClick={applyInputDate}
        type="button"
      >
        Apply
      </Button>
    </div>
  ), [monthInput, dayInput, yearInput, handleInputChange, applyInputDate]);

  // Memoize the calendar component to prevent unnecessary re-renders
  const calendarComponent = React.useMemo(() => (
    <>
      {minAge > 0 && (
        <div className="px-3 py-2 text-xs text-amber-600 bg-amber-50 border-b">
          You must be at least {minAge} years old to continue.
        </div>
      )}
      <Calendar
        mode="single"
        selected={value}
        onSelect={(date) => {
          // Additional validation before calling handleSelect
          if (date && minAge > 0 && minDate && date > minDate) {
            toast.error(`You must be at least ${minAge} years old.`);
            return;
          }
          handleSelect(date);
        }}
        month={currentDate}
        onMonthChange={setCurrentDate}
        className="rounded-md"
        disabled={(date) => {
          // Disable future dates
          if (date > today) return true;

          // Disable dates that don't meet minimum age requirement
          if (minAge > 0 && minDate && date > minDate) return true;

          return false;
        }}
      />
    </>
  ), [value, currentDate, handleSelect, setCurrentDate, today, minAge, minDate]);

  // Reference to the animation JSON
  const [animationData, setAnimationData] = React.useState<any>(null);

  // Load the animation data
  React.useEffect(() => {
    // Dynamically import the animation data
    fetch('/animations/checkmark.json')
      .then(response => response.json())
      .then(data => setAnimationData(data))
      .catch(error => console.error('Error loading animation:', error));
  }, []);

  // Memoize the button content
  const buttonContent = React.useMemo(() => (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center">
        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
        {value ? (
          <span className="font-medium">{format(value, 'MMMM d, yyyy')}</span>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </div>

      <AnimatePresence>
        {showCheckmark && value && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              transition: {
                type: "spring",
                stiffness: 500,
                damping: 15
              }
            }}
            className="h-7 w-7"
          >
            <Lottie
              animationData={animationData}
              loop={false}
              autoplay={true}
              style={{ height: '100%', width: '100%' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  ), [value, placeholder, showCheckmark, animationData]);

  return (
    <div className={cn('grid gap-2', className)}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal h-12 border border-gray-200 rounded-xl bg-white shadow-sm',
              'hover:border-gray-300 hover:bg-gray-50 transition-all duration-200',
              !value && 'text-muted-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            disabled={disabled}
            onClick={() => {
              setView('calendar');
            }}
          >
            {buttonContent}
          </Button>
        </DialogTrigger>
        <DialogContent
          className="p-0 rounded-xl border border-gray-200 shadow-lg max-h-[90vh] overflow-auto sm:max-w-md bg-white"
          onInteractOutside={() => setOpen(false)}
          onEscapeKeyDown={() => setOpen(false)}
          hideCloseButton={true}
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <DialogHeader className="p-3 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold">Select Date</DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                    onClick={() => setView('year')}
                    type="button"
                  >
                    {getYear(currentDate)}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full"
                    onClick={() => setView('month')}
                    type="button"
                  >
                    {months[getMonth(currentDate)]}
                  </Button>
                  <DialogClose asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <CloseIcon className="h-4 w-4" />
                    </Button>
                  </DialogClose>
                </div>
              </div>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {view === 'calendar' && (
                <motion.div
                  key="calendar"
                  variants={slideVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {calendarComponent}
                </motion.div>
              )}

              {view === 'year' && <YearGrid />}
              {view === 'month' && <MonthGrid />}
            </AnimatePresence>

            <DirectInput />

            <DialogFooter className="p-4 border-t">
              <Button
                className="w-full rounded-full h-12 text-base font-medium"
                onClick={() => {
                  if (value) {
                    handleSelect(value);
                  } else if (currentDate) {
                    handleSelect(currentDate);
                  }
                }}
              >
                Confirm
              </Button>
            </DialogFooter>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
