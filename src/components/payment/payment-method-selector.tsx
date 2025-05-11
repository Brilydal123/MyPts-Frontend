"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PaymentMethodOption {
  id: string;
  name: string;
  icon: string;
  description?: string;
  disabled?: boolean;
}

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: PaymentMethodOption[];
}

export function PaymentMethodSelector({
  value,
  onChange,
  options,
}: PaymentMethodSelectorProps) {
  const handleSelect = (optionId: string) => {
    onChange(optionId);
  };

  return (
    <div className="flex flex-wrap gap-3 items-center justify-center">
      {options.map((option) => (
        <PaymentMethodCard
          key={option.id}
          option={option}
          isSelected={value === option.id}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}

interface PaymentMethodCardProps {
  option: PaymentMethodOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function PaymentMethodCard({
  option,
  isSelected,
  onSelect,
}: PaymentMethodCardProps) {
  const isDisabled = option.disabled || option.id.includes('-disabled');

  return (
    <motion.div
      whileHover={{ scale: isDisabled ? 1 : 1.02 }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      onClick={() => !isDisabled && onSelect(option.id)}
      className={cn(
        "relative rounded-lg border p-3 transition-all duration-200 flex items-center justify-center h-[60px] w-[70px]",
        isDisabled
          ? "cursor-not-allowed border-muted bg-muted/20 opacity-70"
          : "cursor-pointer",
        isSelected && !isDisabled
          ? "border-primary bg-primary/5 shadow-sm"
          : !isDisabled ? "border-border hover:border-primary/50 hover:bg-muted/50" : ""
      )}
    >
      {isSelected && !isDisabled && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-2 w-2 text-white"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </motion.div>
      )}

      {isDisabled && (
        <div className="absolute -top-1 -right-1 bg-muted-foreground text-[9px] text-white px-1.5 py-0.5 rounded-sm font-medium">
          Soon
        </div>
      )}

      <div className="h-10 w-16 flex items-center justify-center">
        <img
          src={option.icon}
          alt={option.name}
          title={option.name}
          className={`h-full max-h-10 w-auto object-contain ${option.icon.endsWith('.svg') ? '' : 'rounded-sm'}`}
        />
      </div>
    </motion.div>
  );
}
