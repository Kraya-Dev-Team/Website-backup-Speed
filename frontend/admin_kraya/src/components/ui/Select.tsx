import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  value?: string;
  defaultValue?: string;
  label?: string;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  value,
  defaultValue = "",
  label,
  disabled = false,
}) => {
  const [internalValue, setInternalValue] = useState<string>(defaultValue);

  // Use controlled value if provided, otherwise use internal state
  const selectedValue = value !== undefined ? value : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (value === undefined) {
      setInternalValue(val);
    }
    onChange(val); // Trigger parent handler
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-[10px] font-black uppercase text-text-body/40 tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative w-full group">
        <select
          className={`h-11 w-full appearance-none rounded-xl border border-border-light bg-bg-main px-4 pr-11 text-[11px] font-black uppercase tracking-widest shadow-sm outline-none transition-all placeholder:text-gray-400 focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 ${selectedValue
            ? "text-text-heading"
            : "text-gray-400"
            } ${disabled ? "bg-gray-100 opacity-60 cursor-not-allowed border-gray-100 text-gray-400" : "hover:border-gray-300"} ${className}`}
          value={selectedValue}
          onChange={handleChange}
          disabled={disabled}
        >
          {/* Placeholder option */}
          <option
            value=""
            disabled
            className="text-gray-700"
          >
            {placeholder}
          </option>
          {/* Map over options */}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="text-gray-700"
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className="absolute -translate-y-1/2 pointer-events-none right-4 top-1/2 text-brand-600">
          <ChevronDown size={18} strokeWidth={3} />
        </span>
      </div>
    </div>
  );
};

export default Select;
