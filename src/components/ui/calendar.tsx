"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-full max-w-full",
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-2 w-full",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium text-gray-700",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 transition-opacity rounded-full flex items-center justify-center hover:bg-gray-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full justify-between",
        head_cell:
          "text-gray-500 rounded-md w-8 font-normal text-[0.8rem] py-1.5 text-center",
        row: "flex w-full mt-1 justify-between",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-blue-50 [&:has([aria-selected])]:rounded-full flex items-center justify-center",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-full [&:has(>.day-range-start)]:rounded-l-full first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full"
            : "[&:has([aria-selected])]:rounded-full"
        ),
        day: cn(
          "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-40 transition-all duration-200 flex items-center justify-center",
          "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none data-[disabled]:hover:bg-transparent"
        ),
        day_range_start:
          "day-range-start aria-selected:bg-blue-500 aria-selected:text-white",
        day_range_end:
          "day-range-end aria-selected:bg-blue-500 aria-selected:text-white",
        day_selected:
          "bg-blue-500 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-500 focus:text-white shadow-sm",
        day_today: "border border-blue-200 text-blue-600 font-medium",
        day_outside:
          "day-outside text-gray-400 aria-selected:text-white opacity-50",
        day_disabled: "text-gray-300 opacity-40 hover:bg-transparent",
        day_range_middle:
          "aria-selected:bg-blue-100 aria-selected:text-blue-700",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4 text-gray-600", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4 text-gray-600", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}

export { Calendar }
