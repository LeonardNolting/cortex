"use client"

import * as React from "react"
import { format, parseISO, isValid, parse } from "date-fns"
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
import { Input } from "@/components/ui/input"

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
  placeholder = "TT.MM.JJJJ",
  className,
  disabled,
  clearable = false
}: DatePickerProps) {
  const [inputValue, setInputValue] = React.useState("")

  const selectedDate = React.useMemo(() => {
    if (!date) return undefined
    if (date instanceof Date) return date
    const parsed = parseISO(date)
    return isValid(parsed) ? parsed : undefined
  }, [date])

  React.useEffect(() => {
    if (selectedDate) {
      setInputValue(format(selectedDate, "dd.MM.yyyy"))
    } else {
      setInputValue("")
    }
  }, [selectedDate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    if (!value) {
      if (clearable) setDate(undefined)
      return
    }

    // Attempt to parse the input (German format: dd.MM.yyyy)
    const parsed = parse(value, "dd.MM.yyyy", new Date())
    if (isValid(parsed) && value.length === 10) {
      setDate(format(parsed, "yyyy-MM-dd"))
    }
  }

  const handleBlur = () => {
    if (selectedDate) {
      setInputValue(format(selectedDate, "dd.MM.yyyy"))
    } else if (inputValue === "") {
      setDate(undefined)
    } else {
      // If invalid on blur, revert to empty or previous valid date
      setInputValue(selectedDate ? format(selectedDate, "dd.MM.yyyy") : "")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const parsed = parse(inputValue, "dd.MM.yyyy", new Date())
      if (isValid(parsed)) {
        setDate(format(parsed, "yyyy-MM-dd"))
        // Optional: close popover on Enter if desired, 
        // but Popover usually handles this or stays open.
      }
    }
  }

  return (
    <div className={cn("flex w-full min-w-0 gap-1", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative flex-1 min-w-0">
            <Input
              className={cn(
                "pl-9",
                !selectedDate && "text-muted-foreground"
              )}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
            />
            <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                setDate(format(date, "yyyy-MM-dd"))
              } else if (clearable) {
                setDate(undefined)
              }
            }}
            // initialFocus
            locale={de}
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={new Date(new Date().getFullYear() + 10, 11)}
          />
        </PopoverContent>
      </Popover>
      {clearable && selectedDate && (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setDate(undefined)}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
