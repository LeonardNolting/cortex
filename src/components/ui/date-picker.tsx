"use client"

import * as React from "react"
import { format, parseISO, isValid } from "date-fns"
import { CalendarIcon, X } from "lucide-react"
import { de } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: string | Date
  setDate: (date?: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  clearable?: boolean
}

export function DatePicker({
  date,
  setDate,
  placeholder = "Datum wählen",
  className,
  disabled,
  clearable = false
}: DatePickerProps) {
  const selectedDate = React.useMemo(() => {
    if (!date) return undefined
    if (date instanceof Date) return date
    const parsed = parseISO(date)
    return isValid(parsed) ? parsed : undefined
  }, [date])

  return (
    <div className="flex w-full min-w-0 gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              // Must be allowed to shrink when the clear button is present
              "h-10 flex-1 min-w-0 shrink justify-start px-3 text-left font-normal",
              !selectedDate && "text-muted-foreground",
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedDate ? format(selectedDate, "PPP", { locale: de }) : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setDate(format(date, "yyyy-MM-dd"))
              } else {
                setDate(undefined)
              }
            }}
            initialFocus
            locale={de}
          />
        </PopoverContent>
      </Popover>
      {clearable && selectedDate && (
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setDate(undefined)}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
