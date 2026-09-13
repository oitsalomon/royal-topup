import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export function Input({
    label,
    error,
    id,
    className = '',
    ...props
}: InputProps) {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
        <div className="w-full space-y-1 text-left">
            {label && (
                <label htmlFor={inputId} className="block text-xs font-inter font-medium text-[#f3ecd8]">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={`w-full bg-[#0d0d0f] border ${error ? 'border-red-500' : 'border-[#8a6d38]/40'} focus:border-[#c5a369] text-[#f3ecd8] placeholder-[#7a766c] rounded-[6px] px-3.5 py-2 text-base sm:text-sm font-inter outline-none transition-colors ${className}`}
                {...props}
            />
            {error && (
                <p className="text-[11px] text-red-400 font-inter mt-0.5">{error}</p>
            )}
        </div>
    )
}

export default Input
