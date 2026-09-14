
export const formatChip = (amount: number): string => {
    if (!amount) return '0'
    const absAmount = Math.abs(amount)

    // Jika raw chip count
    if (absAmount >= 1_000_000_000) {
        return (amount / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' B'
    }
    if (absAmount >= 1_000_000) {
        return (amount / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' M'
    }

    // Jika nilai sudah dalam satuan B (e.g. 0.2 = 200M, 1 = 1B, 5 = 5B)
    if (absAmount < 1) {
        return Math.round(amount * 1000).toLocaleString('id-ID') + ' M'
    }

    return amount.toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' B'
}

export const formatIDR = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}
