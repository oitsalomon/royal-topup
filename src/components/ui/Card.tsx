import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'gold' | 'flat'
    children: React.ReactNode
}

export function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
    let baseStyles = 'rounded-[8px] p-4 sm:p-5 transition-all text-[#f3ecd8]'
    
    if (variant === 'gold') {
        baseStyles += ' bg-gradient-to-b from-[#c5a369] to-[#8a6d38] border border-[#8a6d38] text-[#0d0d0f]'
    } else if (variant === 'flat') {
        baseStyles += ' bg-[#0d0d0f] border border-[#8a6d38]/30'
    } else {
        baseStyles += ' bg-[#17171a] border border-[#8a6d38]/35 shadow-sm'
    }

    return (
        <div className={`${baseStyles} ${className}`} {...props}>
            {children}
        </div>
    )
}

export default Card
