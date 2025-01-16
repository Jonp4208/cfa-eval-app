import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

interface MultiSelectProps {
  value: string[]
  onValueChange: (value: string[]) => void
  children: React.ReactNode
}

export function MultiSelect({ value, onValueChange, children }: MultiSelectProps) {
  const handleValueChange = (newValue: string) => {
    if (value.includes(newValue)) {
      onValueChange(value.filter(v => v !== newValue))
    } else {
      onValueChange([...value, newValue])
    }
  }

  return (
    <Select value={value.join(',')} onValueChange={handleValueChange}>
      {children}
    </Select>
  )
}

export { SelectContent, SelectItem, SelectTrigger, SelectValue } 