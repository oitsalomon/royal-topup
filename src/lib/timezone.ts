/**
 * Timezone utilities for Royal Clover Admin using IANA 'Asia/Jakarta' (WIB).
 * Uses native Intl.DateTimeFormat for robust timezone calculations across client and server.
 */

export const JAKARTA_TIMEZONE = 'Asia/Jakarta'

/**
 * Format a Date object into Asia/Jakarta Date String (YYYY-MM-DD)
 */
export function getJakartaDateString(date: Date = new Date()): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: JAKARTA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    })
    return formatter.format(date) // Returns YYYY-MM-DD
}

/**
 * Format a Date object into Asia/Jakarta Time String (HH:mm)
 */
export function getJakartaTimeString(date: Date = new Date()): string {
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: JAKARTA_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    })
    return formatter.format(date) // Returns HH:mm
}

/**
 * Parse a given YYYY-MM-DD and HH:mm in Asia/Jakarta into a precise UTC Date object.
 * Does not rely on client browser timezone or hardcoded offsets.
 */
export function parseJakartaDateTime(dateStr: string, timeStr: string = '00:00'): Date {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hour = 0, minute = 0] = timeStr.split(':').map(Number)

    // Baseline reference in UTC
    const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0))

    // Determine the exact offset difference in Asia/Jakarta using Intl
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: JAKARTA_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    })

    const parts = formatter.formatToParts(utcGuess)
    const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value || '0'

    const jYear = Number(getPart('year'))
    const jMonth = Number(getPart('month'))
    const jDay = Number(getPart('day'))
    let jHour = Number(getPart('hour'))
    if (jHour === 24) jHour = 0
    const jMinute = Number(getPart('minute'))

    const jakartaAsUTC = Date.UTC(jYear, jMonth - 1, jDay, jHour, jMinute, 0, 0)
    const offsetDiffMs = jakartaAsUTC - utcGuess.getTime()

    return new Date(utcGuess.getTime() - offsetDiffMs)
}

/**
 * Returns today's default range in Asia/Jakarta (00:00 to 23:59:59.999)
 */
export function getJakartaTodayRange(): {
    startDateStr: string
    startTimeStr: string
    endDateStr: string
    endTimeStr: string
    startUTC: Date
    endUTC: Date
} {
    const todayStr = getJakartaDateString(new Date())
    const startUTC = parseJakartaDateTime(todayStr, '00:00')
    const endUTC = new Date(parseJakartaDateTime(todayStr, '23:59').getTime() + 59999)

    return {
        startDateStr: todayStr,
        startTimeStr: '00:00',
        endDateStr: todayStr,
        endTimeStr: '23:59',
        startUTC,
        endUTC
    }
}

/**
 * Format a Date for display in Indonesian Jakarta time (e.g. "13 Sep 2026, 14:30 WIB")
 */
export function formatJakartaDisplay(date: Date | string | number | null | undefined): string {
    if (!date) return '—'
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    if (isNaN(d.getTime())) return '—'

    const formatter = new Intl.DateTimeFormat('id-ID', {
        timeZone: JAKARTA_TIMEZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    })

    return `${formatter.format(d).replace(/\./g, ':')} WIB`
}

/**
 * Format short Jakarta date for range display (e.g. "13 Sep 2026")
 */
export function formatJakartaDateOnly(dateStr: string): string {
    if (!dateStr) return '—'
    const [y, m, d] = dateStr.split('-').map(Number)
    const temp = new Date(Date.UTC(y, m - 1, d, 12, 0, 0))
    return new Intl.DateTimeFormat('id-ID', {
        timeZone: JAKARTA_TIMEZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(temp)
}
