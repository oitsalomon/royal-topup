import React from 'react'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'gold' | 'success' | 'danger' | 'outline'
    children: React.ReactNode
}

export function Badge({
    variant = 'gold',
    className = '',
    children,
    ...props
}: BadgeProps) {
    let variantStyles = ''
    switch (variant) {
        case 'gold':
            variantStyles = 'bg-[#17171a] text-[#e8c883] border border-[#8a6d38]'
            break
        case 'success':
            variantStyles = 'bg-[#3fa46a] text-white'
            break
        case 'danger':
            variantStyles = 'bg-[#3a3a3f] text-red-300 border border-red-500/40'
            break
        case 'outline':
            variantStyles = 'bg-transparent text-[#f3ecd8] border border-[#8a6d38]/50'
            break
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-inter font-medium leading-none ${variantStyles} ${className}`}
            {...props}
        >
            {children}
        </span>
    )
}

export default Badge
