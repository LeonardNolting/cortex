import React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

// Extending props from the base Input component
type InputProps = React.ComponentProps<typeof Input>;

interface NumericInputProps extends Omit<InputProps, 'value' | 'onChange'> {
    value: string;
    onValueChange: (value: string) => void;
}

export function NumericInput({ value, onValueChange, ...props }: NumericInputProps) {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Allow empty string, or a string that is a valid decimal number with a comma
        const sanitizedValue = val.replace('.',',');
        if (sanitizedValue === "" || /^[0-9]*\,?[0-9]*$/.test(sanitizedValue)) {
            onValueChange(sanitizedValue);
        }
    }

    return (
        <Input 
            type="text"
            inputMode="decimal"
            value={value}
            onChange={handleChange}
            {...props}
        />
    )
}
