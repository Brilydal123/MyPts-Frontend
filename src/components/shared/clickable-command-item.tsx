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
>(({ className, onItemClick, onClick, children, ...props }, ref) => {
  return (
    <CommandItem
      ref={ref}
      className={cn("cursor-pointer relative", className)}
      onSelect={() => {
        if (onItemClick) {
          onItemClick();
        }
      }}
      {...props}
    >
      {children}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (onItemClick) {
            onItemClick();
          }
          if (onClick) {
            onClick(e);
          }
        }}
      />
    </CommandItem>
  );
});

ClickableCommandItem.displayName = "ClickableCommandItem";

export { ClickableCommandItem };
