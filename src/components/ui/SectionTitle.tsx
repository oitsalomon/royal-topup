import React from 'react'

interface SectionTitleProps {
    title: string
    subtitle?: string
    align?: 'center' | 'left'
    className?: string
}

export function SectionTitle({
    title,
    subtitle,
    align = 'center',
    className = ''
}: SectionTitleProps) {
    const alignClasses = align === 'center' ? 'text-center items-center' : 'text-left items-start'

    return (
        <div className={`flex flex-col space-y-1.5 ${alignClasses} ${className}`}>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-poppins font-bold text-[#f3ecd8] leading-tight">
                {title}
            </h2>
            {subtitle && (
                <p className="text-xs sm:text-sm font-inter text-[#a89f8a] max-w-xl leading-relaxed">
                    {subtitle}
                </p>
            )}
        </div>
    )
}

export default SectionTitle
