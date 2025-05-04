"use client";

import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import React from "react";
import { Button } from "./button";

interface BackButtonProps {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function BackButton({
  onClick,
  className,
  children = "Go Back",
}: BackButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      type="button"
      className={cn(className, "rounded-full")}
    >
      <ArrowLeft className="size-4" /> {children}
    </Button>
  );
}
