"use client"

import * as React from "react"
import { format, isValid, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface DatePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
  name?: string
}

export function DatePicker({
  date,
  setDate,
  className,
  placeholder = "DD/MM/YYYY",
  disabled,
  required,
  id,
  name
}: DatePickerProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)

  // Sync input value when date prop changes externally
  React.useEffect(() => {
    if (date) {
      setInputValue(format(date, "dd/MM/yyyy"))
      setError(null)
    } else {
      setInputValue("")
    }
  }, [date])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "") // Remove non-digits

    // Masking logic
    if (value.length > 8) value = value.slice(0, 8)
    
    if (value.length >= 5) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`
    } else if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`
    }

    setInputValue(value)

    // Real-time validation if complete
    if (value.length === 10) {
      const parsedDate = parse(value, "dd/MM/yyyy", new Date())
      // Check if logical date (e.g. not 32/01)
      const [day, month, year] = value.split('/').map(Number)
      
      if (
          isValid(parsedDate) &&
          parsedDate.getDate() === day &&
          parsedDate.getMonth() + 1 === month &&
          parsedDate.getFullYear() === year &&
          month >= 1 && month <= 12 &&
          day >= 1 && day <= 31 &&
          year > 1900 // basic sanity check
      ) {
        setDate(parsedDate)
        setError(null)
      } else {
        setError("Data inválida")
        // Don't setDate if invalid to avoid breaking upstream logic expecting valid dates
      }
    } else if (value.length === 0) {
       if (!required) {
           setDate(undefined)
           setError(null)
       }
    }
  }

  const handleBlur = () => {
      if (inputValue.length > 0 && inputValue.length < 10) {
          setError("Formato incompleto")
          return
      }
      
      if (inputValue.length === 10) {
          const parsedDate = parse(inputValue, "dd/MM/yyyy", new Date())
           // Extra validation for ranges
           const [day, month, year] = inputValue.split('/').map(Number)
           
           if (
              !isValid(parsedDate) ||
              parsedDate.getDate() !== day ||
              parsedDate.getMonth() + 1 !== month ||
              parsedDate.getFullYear() !== year ||
              month < 1 || month > 12 || 
              day < 1 || day > 31 ||
              year < 1900
           ) {
               setError("Data inválida")
               return
           }
           
           setDate(parsedDate)
           setError(null)
      }
  }

  const handleCalendarSelect = (newDate: Date | undefined) => {
    setDate(newDate)
    if (newDate) {
      setInputValue(format(newDate, "dd/MM/yyyy"))
      setError(null)
    } else {
      setInputValue("")
    }
    setIsPopoverOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      {/* Hidden input to ensure form submission works if needed, though usually handled by state */}
      {name && <input type="hidden" name={name} value={date ? format(date, "yyyy-MM-dd") : ""} />}
      
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "pl-10",
            error ? "border-red-500 focus-visible:ring-red-500" : ""
          )}
          maxLength={10}
          autoComplete="off"
        />
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              type="button"
              className={cn(
                "absolute left-0 top-0 h-full w-11 px-0 hover:bg-transparent flex items-center justify-center",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
              tabIndex={-1}
            >
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleCalendarSelect}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
        
        {error && (
            <div className="absolute right-3 top-2.5 z-10">
                <Tooltip>
                    <TooltipTrigger asChild>
                         <AlertCircle className="h-4 w-4 text-red-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{error}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        )}
      </div>
    </div>
  )
}
