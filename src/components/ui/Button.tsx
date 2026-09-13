import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'confirm' | 'cancel' | 'gold' | 'pill'
    size?: 'sm' | 'md' | 'lg'
    children: React.ReactNode
}

export function Button({
    variant = 'confirm',
    size = 'md',
    className = '',
    children,
    ...props
}: ButtonProps) {
    let variantStyles = ''
    switch (variant) {
        case 'confirm':
            variantStyles = 'bg-[#3fa46a] hover:bg-[#358a59] text-white font-poppins font-semibold rounded-[6px] shadow-sm'
            break
        case 'cancel':
            variantStyles = 'bg-[#3a3a3f] hover:bg-[#48484e] text-[#f3ecd8] font-poppins font-semibold rounded-[6px]'
            break
        case 'gold':
            variantStyles = 'bg-[#17171a] border border-[#8a6d38] hover:border-[#c5a369] text-[#f3ecd8] font-poppins font-semibold rounded-[6px]'
            break
        case 'pill':
            variantStyles = 'rounded-full bg-[#17171a] border border-[#8a6d38] hover:border-[#c5a369] text-[#f3ecd8] font-poppins font-semibold text-xs'
            break
    }

    let sizeStyles = 'px-4 py-2 text-xs sm:text-sm'
    if (size === 'sm') sizeStyles = 'px-3 py-1 text-xs'
    if (size === 'lg') sizeStyles = 'px-6 py-2.5 text-sm sm:text-base'
    if (variant === 'pill') sizeStyles = 'px-4 py-1.5 text-xs'

    return (
        <button
            className={`inline-flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${variantStyles} ${sizeStyles} ${className}`}
            {...props}
        >
            {children}
        </button>
    )
}

export default Button
