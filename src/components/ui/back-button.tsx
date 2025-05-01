'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function BackButton({
  onClick,
  className,
  children = 'Go Back',
}: BackButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center h-12",
   "border border-gray-300 rounded-full",
        "text-gray-700 font-medium text-sm tracking-wide",
        "overflow-hidden  cursor-pointer",
        "transition-all duration-300 ease-out",
        "focus:outline-none",
        className
      )}
      whileHover={{
        scale: 1.02,
        borderColor: "#000",
        // boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background gradient animation on hover */}
      <motion.div
        className="absolute inset-0  opacity-0"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Content */}
      <motion.div
        className="flex items-center justify-center relative z-10"
        initial={{ x: 0 }}
        whileHover={{ x: -3 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        {/* Arrow with animation */}
        <motion.div
          className="flex items-center justify-center w-6 h-6 mr-2 rounded-full bg-black text-white"
          initial={{ x: 0 }}
          whileHover={{ x: -2 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          <span className="text-sm">←</span>
        </motion.div>

        {/* Text */}
        <span className="font-semibold uppercase text-xs tracking-wider">{children}</span>
      </motion.div>
    </motion.button>
  );
}
