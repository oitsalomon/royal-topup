
export const formatChip = (amount: number): string => {
    if (!amount) return '0'
    const absAmount = Math.abs(amount)

    if (absAmount >= 1_000_000_000) {
        return (amount / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' B'
    }
    if (absAmount >= 1_000_000) {
        return (amount / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' M'
    }

    return amount.toLocaleString('id-ID')
}

export const formatIDR = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}
