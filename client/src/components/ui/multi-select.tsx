import * as React from "react"
import { cn } from "@/lib/utils"

export type Option = {
  value: string
  label: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
}: MultiSelectProps) {
  const handleSelect = React.useCallback((currentValue: string) => {
    const newSelected = selected.includes(currentValue)
      ? selected.filter((value) => value !== currentValue)
      : [...selected, currentValue]
    onChange(newSelected)
  }, [selected, onChange])

  return (
    <div className={cn("space-y-1", className)}>
      <div className="w-full rounded-lg border border-gray-200 bg-white p-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-sm"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => handleSelect(option.value)}
              className="h-4 w-4 rounded border-gray-300 text-[#E51636] focus:ring-[#E51636]"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  )
} 