"use client";

import * as React from "react";
import { CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ClickableCommandItemProps extends React.ComponentPropsWithoutRef<typeof CommandItem> {
  onItemClick?: () => void;
}

/**
 * A wrapper around CommandItem that adds a click handler
 */
const ClickableCommandItem = React.forwardRef<
  React.ElementRef<typeof CommandItem>,
  ClickableCommandItemProps
>(({ className, onItemClick, onClick, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Call the original onClick if provided
    if (onClick) {
      onClick(e);
    }
    
    // Call our custom onItemClick handler
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <CommandItem
      ref={ref}
      className={cn("cursor-pointer", className)}
      onClick={handleClick}
      {...props}
    />
  );
});

ClickableCommandItem.displayName = "ClickableCommandItem";

export { ClickableCommandItem };
