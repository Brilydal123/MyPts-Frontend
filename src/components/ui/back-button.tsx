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
  children = "",
}: BackButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      type="button"
      className={cn(className, "rounded-full w-10 h-10 shadow-2xl border bg-blue-50")}
    >
      <ArrowLeft className="size-4" /> {children}
    </Button>
  );
}
