'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button, } from '@/components/ui/button';

interface AnimatedButtonProps extends Omit<any, 'type'> {
  className?: string;
  children: React.ReactNode;
  active?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function AnimatedButton({
  className,
  children,
  active = false,
  disabled = false,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
    >
      <Button
        {...props}
        disabled={disabled}
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          active ? "auth-button active" : "auth-button",
          className
        )}
      >
        <motion.div
          className="relative z-10 flex items-center justify-center"
          initial={{ y: 0 }}
          whileHover={!disabled ? { y: -2 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          {children}
        </motion.div>
      </Button>
    </motion.div>
  );
}
