'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, RotateCcw, Check, X } from 'lucide-react'
import {
    getJakartaDateString,
    formatJakartaDateOnly,
    getJakartaTodayRange
} from '@/lib/timezone'

export interface DateTimeRangeValue {
    startDateStr: string // YYYY-MM-DD
    startTimeStr: string // HH:mm
    endDateStr: string   // YYYY-MM-DD
    endTimeStr: string   // HH:mm
}

interface DateTimePickerRangeProps {
    value: DateTimeRangeValue
    onChange: (val: DateTimeRangeValue) => void
    onReset?: () => void
    className?: string
}

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export default function DateTimePickerRange({
    value,
    onChange,
    className = ''
}: DateTimePickerRangeProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Local state while picking in popup
    const [tempStart, setTempStart] = useState(value.startDateStr)
    const [tempStartTime, setTempStartTime] = useState(value.startTimeStr || '00:00')
    const [tempEnd, setTempEnd] = useState(value.endDateStr)
    const [tempEndTime, setTempEndTime] = useState(value.endTimeStr || '23:59')

    // Current viewed calendar month/year
    const initialDate = value.startDateStr ? new Date(value.startDateStr) : new Date()
    const [viewYear, setViewYear] = useState(initialDate.getFullYear())
    const [viewMonth, setViewMonth] = useState(initialDate.getMonth()) // 0-indexed

    // Selecting phase: 0 = start date, 1 = end date
    const [pickingStep, setPickingStep] = useState<0 | 1>(0)
    const [hoverDate, setHoverDate] = useState<string | null>(null)

    // Keep temp in sync when value changes from outside
    useEffect(() => {
        setTempStart(value.startDateStr)
        setTempStartTime(value.startTimeStr || '00:00')
        setTempEnd(value.endDateStr)
        setTempEndTime(value.endTimeStr || '23:59')
    }, [value])

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handlePrevMonth = () => {
        if (viewMonth === 0) {
            setViewMonth(11)
            setViewYear(v => v - 1)
        } else {
            setViewMonth(v => v - 1)
        }
    }

    const handleNextMonth = () => {
        if (viewMonth === 11) {
            setViewMonth(0)
            setViewYear(v => v + 1)
        } else {
            setViewMonth(v => v + 1)
        }
    }

    // Days in viewMonth
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    const handleDayClick = (day: number) => {
        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

        if (pickingStep === 0) {
            setTempStart(dateStr)
            setTempEnd(dateStr)
            setPickingStep(1)
        } else {
            if (dateStr < tempStart) {
                setTempEnd(tempStart)
                setTempStart(dateStr)
            } else {
                setTempEnd(dateStr)
            }
            setPickingStep(0)
        }
    }

    const handleApply = () => {
        if (!tempStart || !tempEnd) {
            handleResetToday()
            return
        }
        let finalStart = tempStart
        let finalEnd = tempEnd
        if (finalStart > finalEnd) {
            finalStart = tempEnd
            finalEnd = tempStart
        }
        onChange({
            startDateStr: finalStart,
            startTimeStr: tempStartTime || '00:00',
            endDateStr: finalEnd,
            endTimeStr: tempEndTime || '23:59'
        })
        setIsOpen(false)
    }

    const handleResetToday = () => {
        const today = getJakartaTodayRange()
        setTempStart(today.startDateStr)
        setTempStartTime(today.startTimeStr)
        setTempEnd(today.endDateStr)
        setTempEndTime(today.endTimeStr)
        onChange({
            startDateStr: today.startDateStr,
            startTimeStr: today.startTimeStr,
            endDateStr: today.endDateStr,
            endTimeStr: today.endTimeStr
        })
        setIsOpen(false)
    }

    const handleResetAllTime = () => {
        setTempStart('')
        setTempStartTime('')
        setTempEnd('')
        setTempEndTime('')
        onChange({
            startDateStr: '',
            startTimeStr: '',
            endDateStr: '',
            endTimeStr: ''
        })
        setIsOpen(false)
    }

    // Format trigger label
    const isAllTime = !value.startDateStr || !value.endDateStr
    const triggerLabel = isAllTime
        ? 'Semua Waktu'
        : `${formatJakartaDateOnly(value.startDateStr)}, ${value.startTimeStr || '00:00'} — ${formatJakartaDateOnly(value.endDateStr)}, ${value.endTimeStr || '23:59'}`

    return (
        <div className={`relative inline-block ${className}`} ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#17171a] border border-[#c5a369]/30 hover:border-[#c5a369] text-[#f3ecd8] text-xs font-inter transition-colors shadow-xs"
            >
                <CalendarIcon size={16} strokeWidth={1.5} className="text-[#c5a369] shrink-0" />
                <span className="font-semibold text-xs text-[#f3ecd8] whitespace-nowrap">
                    {triggerLabel}
                </span>
                <span className="text-[10px] text-[#8a6d38] font-mono px-1.5 py-0.5 rounded bg-black/40 border border-[#8a6d38]/30">
                    WIB
                </span>
            </button>

            {/* Dropdown Popup */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 w-[340px] sm:w-[370px] bg-[#17171a] border border-[#c5a369]/30 rounded-xl shadow-2xl p-4 text-[#f3ecd8] animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <span className="text-xs font-poppins font-bold text-[#c5a369] uppercase tracking-wider flex items-center gap-1.5">
                            <Clock size={14} strokeWidth={1.5} />
                            Filter Periode Transaksi
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-[#a89f8a] hover:text-white p-1 rounded-md transition-colors"
                        >
                            <X size={14} strokeWidth={1.5} />
                        </button>
                    </div>

                    {/* Month Navigator */}
                    <div className="flex items-center justify-between mt-3 mb-2 px-1">
                        <span className="font-poppins font-bold text-xs text-[#f3ecd8]">
                            {MONTH_NAMES[viewMonth]} {viewYear}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-1.5 rounded-md bg-[#131417] border border-white/10 hover:border-[#c5a369]/50 text-[#a89f8a] hover:text-white transition-colors"
                            >
                                <ChevronLeft size={14} strokeWidth={1.5} />
                            </button>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="p-1.5 rounded-md bg-[#131417] border border-white/10 hover:border-[#c5a369]/50 text-[#a89f8a] hover:text-white transition-colors"
                            >
                                <ChevronRight size={14} strokeWidth={1.5} />
                            </button>
                        </div>
                    </div>

                    {/* Day Names Header */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {DAY_NAMES.map((d, i) => (
                            <span key={i} className="text-[10px] font-semibold text-[#8a6d38] uppercase">
                                {d}
                            </span>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells before 1st day */}
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-8" />
                        ))}

                        {/* Month Days */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1
                            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

                            const isStart = dateStr === tempStart
                            const isEnd = dateStr === tempEnd
                            const inRange = (tempStart && tempEnd && dateStr > tempStart && dateStr < tempEnd) ||
                                (hoverDate && tempStart && pickingStep === 1 && dateStr > tempStart && dateStr <= hoverDate)

                            let dayClass = 'text-[#f3ecd8] hover:bg-white/10'
                            if (isStart || isEnd) {
                                dayClass = 'bg-[#c5a369] text-black font-bold shadow-xs'
                            } else if (inRange) {
                                dayClass = 'bg-[#c5a369]/20 text-[#f3ecd8]'
                            }

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDayClick(day)}
                                    onMouseEnter={() => setHoverDate(dateStr)}
                                    className={`h-8 rounded text-xs flex items-center justify-center transition-all ${dayClass}`}
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>

                    {/* Time Range Inputs (24 Jam) */}
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {/* Start Time */}
                            <div className="bg-[#131417] p-2 rounded-lg border border-white/5">
                                <label className="block text-[10px] text-[#8a6d38] font-bold uppercase mb-1">
                                    Mulai Jam (WIB)
                                </label>
                                <input
                                    type="time"
                                    value={tempStartTime}
                                    onChange={e => setTempStartTime(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-[#f3ecd8] font-mono focus:border-[#c5a369] outline-hidden"
                                />
                            </div>

                            {/* End Time */}
                            <div className="bg-[#131417] p-2 rounded-lg border border-white/5">
                                <label className="block text-[10px] text-[#8a6d38] font-bold uppercase mb-1">
                                    Sampai Jam (WIB)
                                </label>
                                <input
                                    type="time"
                                    value={tempEndTime}
                                    onChange={e => setTempEndTime(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-[#f3ecd8] font-mono focus:border-[#c5a369] outline-hidden"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 gap-2">
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={handleResetAllTime}
                                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                                    isAllTime
                                        ? 'bg-[#c5a369]/20 text-[#e8c883] font-bold border border-[#c5a369]/40'
                                        : 'text-[#a89f8a] hover:text-[#f3ecd8] hover:bg-white/5'
                                }`}
                                title="Lihat seluruh riwayat tanpa filter tanggal"
                            >
                                <RotateCcw size={12} strokeWidth={1.5} />
                                <span>Semua Waktu</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleResetToday}
                                className="inline-flex items-center gap-1 text-xs text-[#a89f8a] hover:text-[#f3ecd8] hover:bg-white/5 px-2.5 py-1.5 rounded-md transition-colors"
                            >
                                <span>Hari Ini</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="text-xs text-[#a89f8a] hover:text-white px-2.5 py-1.5 rounded-md transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleApply}
                                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#c5a369] hover:bg-[#b08f57] text-black font-poppins font-bold text-xs rounded-lg transition-colors shadow-xs"
                            >
                                <Check size={14} strokeWidth={1.5} />
                                <span>Terapkan</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
