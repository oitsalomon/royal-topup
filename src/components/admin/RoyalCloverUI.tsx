'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'

export const ACCENT = 'var(--rc-accent, #f5b301)'
export const ORANGE = 'var(--rc-orange, #f97316)'
export const BG = 'var(--rc-bg, #0a0b0d)'
export const PANEL = 'var(--rc-panel, #131417)'
export const PANEL2 = 'var(--rc-panel2, #1b1d22)'
export const BORDER = 'var(--rc-border, #26282f)'
export const MUTED = 'var(--rc-muted, #7e8593)'
export const TEXT = 'var(--rc-text, #f3f5f8)'
export const TEXT2 = 'var(--rc-text2, #d6dae1)'
export const TEXT3 = 'var(--rc-text3, #aab0bc)'

export function Badge({
    children,
    color = '#f5b301',
    className = ''
}: {
    children: React.ReactNode
    color?: string
    className?: string
}) {
    const isVar = color.startsWith('var')
    return (
        <span
            className={className}
            style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 999,
                color,
                background: isVar ? 'rgba(245, 179, 1, 0.1)' : color + '1a',
                border: `1px solid ${isVar ? 'rgba(245, 179, 1, 0.25)' : color + '33'}`,
                whiteSpace: 'nowrap'
            }}
        >
            {children}
        </span>
    )
}

export function Panel({
    title,
    subtitle,
    action,
    children,
    className = ''
}: {
    title: React.ReactNode
    subtitle?: React.ReactNode
    action?: React.ReactNode
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={className}
            style={{
                background: PANEL,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: 20
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 16,
                    flexWrap: 'wrap'
                }}
            >
                <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: TEXT }}>{title}</h3>
                    {subtitle && <p style={{ margin: '3px 0 0', fontSize: 13, color: MUTED }}>{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    )
}

export function StatBig({
    label,
    value,
    sub,
    delta,
    deltaUp,
    big = false
}: {
    label: string
    value: React.ReactNode
    sub?: React.ReactNode
    delta?: string | null
    deltaUp?: boolean
    big?: boolean
}) {
    return (
        <div
            className="min-w-0 overflow-hidden min-h-[110px] flex flex-col justify-between"
            style={{
                background: PANEL,
                border: `1px solid ${BORDER}`,
                borderRadius: 16,
                padding: big ? 24 : 18,
                minWidth: 0,
                minHeight: big ? 140 : 110
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span
                    className="truncate"
                    style={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '.05em',
                        textTransform: 'uppercase',
                        color: TEXT3
                    }}
                >
                    {label}
                </span>
                {delta != null && (
                    <span
                        className="shrink-0"
                        style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: deltaUp ? '#34d399' : '#f87171',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {deltaUp ? '↑' : '↓'} {delta}
                    </span>
                )}
            </div>
            <div
                className="truncate break-words"
                style={{
                    fontSize: big ? 32 : 20,
                    fontWeight: 800,
                    color: TEXT,
                    marginTop: big ? 12 : 8,
                    lineHeight: 1.15
                }}
            >
                {value}
            </div>
            {sub && <div className="truncate text-xs" style={{ color: MUTED, marginTop: 6 }}>{sub}</div>}
        </div>
    )
}

export function PageHead({
    crumbs,
    title,
    sub,
    actions
}: {
    crumbs?: string[]
    title: string
    sub?: string
    actions?: React.ReactNode
}) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: 16,
                flexWrap: 'wrap',
                marginBottom: 20
            }}
        >
            <div>
                {crumbs && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: MUTED, marginBottom: 4 }}>
                        {crumbs.map((it, i) => (
                            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ color: i === crumbs.length - 1 ? TEXT2 : MUTED }}>{it}</span>
                                {i < crumbs.length - 1 && <ChevronRight size={13} />}
                            </span>
                        ))}
                    </div>
                )}
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: TEXT }}>{title}</h1>
                {sub && <p style={{ margin: '5px 0 0', fontSize: 14, color: MUTED }}>{sub}</p>}
            </div>
            {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
        </div>
    )
}

export function SectionHead({ title, right }: { title: string; right?: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 10px' }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', color: TEXT3, textTransform: 'uppercase' }}>
                {title}
            </span>
            {right && <span style={{ fontSize: 12, color: MUTED }}>{right}</span>}
        </div>
    )
}

export function Segment({
    options,
    value,
    onChange
}: {
    options: { key: string; label: string }[] | string[]
    value: string
    onChange: (val: string) => void
}) {
    return (
        <div
            style={{
                display: 'inline-flex',
                gap: 4,
                background: PANEL,
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: 4
            }}
        >
            {options.map((o) => {
                const key = typeof o === 'string' ? o : o.key
                const label = typeof o === 'string' ? o : o.label
                const on = value === key
                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => onChange(key)}
                        style={{
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 700,
                            background: on ? ACCENT : 'transparent',
                            color: on ? '#1a1500' : MUTED,
                            transition: 'all .12s'
                        }}
                    >
                        {label}
                    </button>
                )
            })}
        </div>
    )
}

export const inputStyle = {
    background: BG,
    border: `1px solid ${BORDER}`,
    color: TEXT,
    borderRadius: 9,
    padding: '9px 12px',
    fontSize: 14,
    outline: 'none',
    width: '100%',
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />
}

export function SelectInput({
    options,
    ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: (string | { value: string; label: string })[] }) {
    return (
        <select {...props} style={{ ...inputStyle, appearance: 'none', ...(props.style || {}) }}>
            {options.map((o) => {
                const val = typeof o === 'string' ? o : o.value
                const lab = typeof o === 'string' ? o : o.label
                return (
                    <option key={val} value={val} style={{ background: PANEL, color: TEXT }}>
                        {lab}
                    </option>
                )
            })}
        </select>
    )
}

export function PrimaryBtn({
    children,
    onClick,
    type = 'button',
    className = '',
    disabled = false
}: {
    children: React.ReactNode
    onClick?: (() => void) | (() => Promise<void>)
    type?: 'button' | 'submit' | 'reset'
    className?: string
    disabled?: boolean
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={className}
            style={{
                background: ACCENT,
                color: '#1a1500',
                border: 'none',
                borderRadius: 9,
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                transition: 'filter .15s'
            }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = 'brightness(1.1)' }}
            onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.filter = 'none' }}
        >
            {children}
        </button>
    )
}

export function OrangeBtn({
    children,
    onClick,
    type = 'button',
    className = '',
    disabled = false
}: {
    children: React.ReactNode
    onClick?: (() => void) | (() => Promise<void>)
    type?: 'button' | 'submit'
    className?: string
    disabled?: boolean
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={className}
            style={{
                background: ORANGE,
                color: '#fff',
                border: 'none',
                borderRadius: 9,
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7
            }}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = 'brightness(1.08)' }}
            onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.filter = 'none' }}
        >
            {children}
        </button>
    )
}
