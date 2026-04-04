'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import './landing.css'

interface LandingContentProps {
    games: any[]
    config: any
}

export default function LandingContent({ games, config }: LandingContentProps) {
    const [openTrx, setOpenTrx] = useState(false)
    const [openRtp, setOpenRtp] = useState(false)
    const [openTier, setOpenTier] = useState<number | null>(1)
    const [transactions, setTransactions] = useState<any[]>([])
    
    // Ticker names and roots
    const nameRoots = ['Agus', 'Wahyu', 'Rini', 'Budi', 'Joko', 'Siti', 'Yanto', 'Dewi', 'Putra', 'Rizky', 'Hendra', 'Sari', 'Ayu', 'Dimas', 'Eko', 'Fitri', 'Gilang', 'Intan']
    const prefixes = ['0812', '0813', '0852', '0853', '0821', '0822', '0896', '0895', '0819']
    
    const generateIdentity = () => {
        const usePhoneNumber = Math.random() > 0.5
        if (usePhoneNumber) {
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
            const suffix = Math.floor(Math.random() * 900) + 100
            return `${prefix}****${suffix}`
        } else {
            const root = nameRoots[Math.floor(Math.random() * nameRoots.length)]
            const suffixChars = 'abcdefghijklmnopqrstuvwxyz0123456789'
            const randomSuffix = Array.from({ length: 2 }).map(() => suffixChars[Math.floor(Math.random() * suffixChars.length)]).join('')
            return `${root}_${randomSuffix}**`
        }
    }

    const createFakeTrx = () => {
        const isBuy = Math.random() > 0.3
        const amountB = [1, 2, 5, 10, 20, 50, 100][Math.floor(Math.random() * 7)]
        return {
            id: Math.random(),
            name: generateIdentity(),
            type: isBuy ? 'BUY' : 'SELL',
            amount: `${amountB}B`,
            time: 'Baru saja'
        }
    }

    useEffect(() => {
        // Initial fake transactions
        const initial = Array.from({ length: 10 }).map(() => createFakeTrx())
        setTransactions(initial)

        // Combine with real transactions
        fetch('/api/public/recent-transactions')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const realMapped = data.map((t: any) => ({
                        id: t.id,
                        name: t.name,
                        type: t.type === 'TOPUP' ? 'BUY' : 'SELL',
                        amount: t.amountStr,
                        time: 'Tadi'
                    }))
                    setTransactions(prev => [...realMapped, ...prev].slice(0, 20))
                }
            })
            .catch(err => console.error("Failed to fetch real transactions", err))

        // Auto add fake transactions every 5-15 seconds
        const interval = setInterval(() => {
            setTransactions(prev => [createFakeTrx(), ...prev].slice(0, 20))
        }, Math.random() * 10000 + 5000)

        return () => clearInterval(interval)
    }, [])

    const firstGameCode = games.length > 0 ? games[0].code : ''
    const flashSale = config?.flash_sale || {}
    const isFlashSaleActive = flashSale.active && flashSale.end_time > Date.now()

    return (
        <div className="landing-body">
            <main className="landing-wrap">
                {/* TICKER */}
                <div className="ticker">
                    <div className="ticker-track">
                        <div className="ticker-item">⚡ INFO: PROSES TOP UP & WD HANYA HITUNGAN DETIK <span className="t-sep">/</span></div>
                        <div className="ticker-item">💎 CHIP READY STOCK SELALU <span className="t-sep">/</span></div>
                        <div className="ticker-item">🛡️ TRANSAKSI AMAN & TERPERCAYA <span className="t-sep">/</span></div>
                        <div className="ticker-item">⚡ INFO: PROSES TOP UP & WD HANYA HITUNGAN DETIK <span className="t-sep">/</span></div>
                        <div className="ticker-item">💎 CHIP READY STOCK SELALU <span className="t-sep">/</span></div>
                        <div className="ticker-item">🛡️ TRANSAKSI AMAN & TERPERCAYA <span className="t-sep">/</span></div>
                    </div>
                </div>

                {/* HERO SECTION */}
                <section className="hero">
                    <div className="hero-left-col">
                        <div className="hero-badge group flex items-center gap-2 cursor-pointer shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 transition-all">
                            <div className="badge-dot bg-amber-500 animate-ping"></div>
                            <span className="text-amber-500 font-bold tracking-widest text-[10px]">VERSI 4.0 - SISTEM BARU DIAKTIFKAN</span>
                        </div>

                        <h1 className="hero-title">
                            <span className="line1">Premium</span>
                            <span className="line2">Gaming</span>
                            <span className="line3">Experience.</span>
                        </h1>

                        <p className="hero-desc">
                            Nikmati layanan top up chip tercepat di Indonesia. Proses otomatis 24 jam non-stop dengan harga paling kompetitif untuk para sultan.
                        </p>

                        <div className="hero-cta">
                            <Link href={firstGameCode ? `/topup/${firstGameCode}` : '#'} className="cta-main">Beli Chip Sekarang</Link>
                            <Link href="/login" className="cta-sec">Member Area</Link>
                        </div>

                        <div className="stats-row">
                            <div className="stat-cell">
                                <div className="stat-val">24/7</div>
                                <div className="stat-lbl">SUPPORT</div>
                            </div>
                            <div className="stat-cell">
                                <div className="stat-val">1S</div>
                                <div className="stat-lbl">PROSES</div>
                            </div>
                            <div className="stat-cell">
                                <div className="stat-val">10K+</div>
                                <div className="stat-lbl">USERS</div>
                            </div>
                            <div className="stat-cell">
                                <div className="stat-val">100%</div>
                                <div className="stat-lbl">AMAN</div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-right-col">
                        {/* LIVE TRANSAKSI */}
                        <div className={`live-trx-card ${openTrx ? 'open' : ''}`} onClick={() => setOpenTrx(!openTrx)}>
                            <div className="live-trx-header">
                                <div className="live-trx-left">
                                    <div className="live-trx-icon">⚡</div>
                                    <div>
                                        <div className="live-trx-title">Live Transaksi</div>
                                        <div className="live-trx-sub">Real-time Activity</div>
                                    </div>
                                </div>
                                <div className="live-pill">
                                    <div className="badge-dot"></div> LIVE
                                </div>
                            </div>

                            <div className="trx-preview">
                                {transactions.slice(0, 2).map((t, i) => (
                                    <div key={t.id + '-' + i} className="trx-row">
                                        <div className={`trx-row-icon ${t.type === 'BUY' ? 'buy' : 'sell'}`}>
                                            {t.type === 'BUY' ? '📥' : '📤'}
                                        </div>
                                        <div className="trx-row-info">
                                            <div className="trx-row-name">{t.name}</div>
                                            <div className="trx-row-type">{t.type === 'BUY' ? 'Pembelian Chip' : 'Penarikan Dana'}</div>
                                        </div>
                                        <div className="trx-row-right">
                                            <div className={`trx-row-amount ${t.type === 'BUY' ? 'buy' : 'sell'}`}>
                                                {t.type === 'BUY' ? '+' : '-'}{t.amount}
                                            </div>
                                            <div className="trx-row-time">{t.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="trx-expanded">
                                {transactions.slice(2, 8).map((t, i) => (
                                    <div key={t.id + '-' + i} className="trx-row">
                                        <div className={`trx-row-icon ${t.type === 'BUY' ? 'buy' : 'sell'}`}>
                                            {t.type === 'BUY' ? '📥' : '📤'}
                                        </div>
                                        <div className="trx-row-info">
                                            <div className="trx-row-name">{t.name}</div>
                                            <div className="trx-row-type">{t.type === 'BUY' ? 'Pembelian Chip' : 'Penarikan Dana'}</div>
                                        </div>
                                        <div className="trx-row-right">
                                            <div className={`trx-row-amount ${t.type === 'BUY' ? 'buy' : 'sell'}`}>
                                                {t.type === 'BUY' ? '+' : '-'}{t.amount}
                                            </div>
                                            <div className="trx-row-time">{t.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="tap-hint">👆 Tap untuk melihat lebih banyak</div>
                        </div>

                        {/* RTP SECTION */}
                        <div className={`rtp-card ${openRtp ? 'open' : ''}`} onClick={() => setOpenRtp(!openRtp)}>
                            <div className="rtp-header">
                                <div className="rtp-header-left">
                                    <div className="rtp-header-icon">📈</div>
                                    <div>
                                        <div className="rtp-header-title">Live RTP Clover</div>
                                        <div className="rtp-header-sub">Update Setiap 15 Menit</div>
                                    </div>
                                </div>
                                <div className="live-pill" style={{ color: 'var(--amber)', background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }}>
                                    ACCURATE
                                </div>
                            </div>

                            <div className="rtp-teaser">
                                <div className="rtp-teaser-badge">GACOR</div>
                                <div className="rtp-teaser-text">
                                    {config.rtp_config?.[0]?.game || 'Royal Dream'} - {config.rtp_config?.[0]?.percentage || '98'}%
                                </div>
                                <div className="rtp-teaser-cta">CEK SEMUA RTP »</div>
                            </div>

                            <div className="rtp-expanded">
                                {(config.rtp_config || [
                                    { game: 'Royal Dream', room: 'Domino', percentage: 98, status: 'HOT' },
                                    { game: 'Royal Dream', room: 'FaFaFa', percentage: 95, status: 'WARM' },
                                    { game: 'Royal Dream', room: 'DuoFu', percentage: 92, status: 'WARM' },
                                    { game: 'Royal Dream', room: 'Panda', percentage: 89, status: 'COLD' }
                                ]).map((rtp: any, i: number) => (
                                    <div key={i} className="rtp-row">
                                        <div className="rtp-row-game">
                                            <div className="rtp-row-name">{rtp.game}</div>
                                            <div className="rtp-row-room">{rtp.room}</div>
                                        </div>
                                        <div className={`rtp-row-pct ${rtp.status === 'HOT' ? 'pct-hot' : rtp.status === 'WARM' ? 'pct-warm' : 'pct-cold'}`}>
                                            {rtp.percentage}%
                                        </div>
                                        <div className={`rtp-status ${rtp.status === 'HOT' ? 's-hot' : rtp.status === 'WARM' ? 's-warm' : 's-cold'}`}>
                                            {rtp.status}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="tap-hint">👆 Tap untuk sembunyikan</div>
                        </div>
                    </div>
                </section>

                {/* PRICING SECTION */}
                <section className="section v4-container">
                    <div className="section-label">HARGA CHIP TERBARU</div>
                    <div className="price-list">
                        
                        {/* TIER SILVER */}
                        <div className={`tier-card ${openTier === 1 ? 'open' : ''}`}>
                            <div className="tier-header" onClick={() => setOpenTier(openTier === 1 ? null : 1)}>
                                <div className="tier-em">🥈</div>
                                <div className="tier-info">
                                    <div className="tier-name">Tier Silver</div>
                                    <div className="tier-range">Pembelian 1B - 9B</div>
                                </div>
                                <div className="tier-right">
                                    <div className="tier-price-from">Eceran</div>
                                    <div className="tier-price-val">Rp 65.000 / 1B</div>
                                </div>
                                <div className="tier-arrow">▼</div>
                            </div>
                            <div className="tier-body">
                                {[1, 2, 5].map(b => (
                                    <Link key={b} href={`/topup/${firstGameCode}?amount=${b}`} className="paket-row">
                                        <div className="paket-chip">{b}B Chip Royal</div>
                                        <div className="paket-price">Rp {Number(b * 65000).toLocaleString('id-ID')}</div>
                                        <div className="paket-cta">BELI »</div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* TIER GOLD */}
                        <div className={`tier-card best ${openTier === 2 ? 'open' : ''}`}>
                            <div className="tier-header" onClick={() => setOpenTier(openTier === 2 ? null : 2)}>
                                <div className="tier-em">🥇</div>
                                <div className="tier-info">
                                    <div className="tier-name">Tier Gold</div>
                                    <div className="tier-range">Pembelian 10B - 49B</div>
                                </div>
                                <div className="tier-right">
                                    <div className="tier-price-from">Harga Grosir</div>
                                    <div className="tier-price-val">Rp 64.000 / 1B</div>
                                </div>
                                <div className="tier-arrow">▼</div>
                            </div>
                            <div className="tier-body">
                                {[10, 20, 30, 40].map(b => (
                                    <Link key={b} href={`/topup/${firstGameCode}?amount=${b}`} className="paket-row">
                                        <div className="paket-chip">{b}B Chip Royal</div>
                                        <div className="paket-price">Rp {Number(b * 64000).toLocaleString('id-ID')}</div>
                                        <div className="paket-cta">BELI »</div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* TIER DIAMOND */}
                        <div className={`tier-card ${openTier === 3 ? 'open' : ''}`}>
                            <div className="tier-header" onClick={() => setOpenTier(openTier === 3 ? null : 3)}>
                                <div className="tier-em">💎</div>
                                <div className="tier-info">
                                    <div className="tier-name">Tier Diamond</div>
                                    <div className="tier-range">Pembelian 50B keatas</div>
                                </div>
                                <div className="tier-right">
                                    <div className="tier-price-from">Harga Sultan</div>
                                    <div className="tier-price-val">Rp 63.500 / 1B</div>
                                </div>
                                <div className="tier-arrow">▼</div>
                            </div>
                            <div className="tier-body">
                                {[50, 100, 200].map(b => (
                                    <Link key={b} href={`/topup/${firstGameCode}?amount=${b}`} className="paket-row">
                                        <div className="paket-chip">{b}B Chip Royal</div>
                                        <div className="paket-price">Rp {Number(b * 63500).toLocaleString('id-ID')}</div>
                                        <div className="paket-cta">BELI »</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* MITRA & FEATURES */}
                <div className="v4-container">
                    <Link href={firstGameCode ? `/topup/${firstGameCode}` : '#'} className="price-item best" style={{ margin: '0 0 28px' }}>
                        <div className="price-em">🚀</div>
                        <div className="price-info">
                            <div className="price-tier">Ambil Partai Besar (100B+)</div>
                            <div className="price-range">Hubungi Admin untuk Harga Khusus</div>
                        </div>
                        <div className="price-badge">SPECIAL</div>
                    </Link>

                    <div className="mitra-card" style={{ margin: '0 0 32px' }}>
                        <div className="mitra-tag">SUPPORT & CONTACT</div>
                        <div className="mitra-title">Hubungi Kami Disini!</div>
                        <div className="mitra-desc">Butuh bantuan atau informasi lebih lanjut? Tim support kami siap melayani Anda 24/7 melalui WhatsApp, Telegram, dan media sosial lainnya.</div>
                        <a 
                            href={config?.contacts?.whatsapp?.number ? `https://wa.me/${config.contacts.whatsapp.number}` : '#'} 
                            target="_blank" 
                            className="btn-mitra"
                        >
                            Hubungi Admin »
                        </a>
                    </div>

                    <section className="section" style={{ padding: '0 0 32px' }}>
                        <div className="section-label">KEUNGGULAN KAMI</div>
                        <div className="features-grid">
                            <div className="feat-card">
                                <div className="feat-icon">⚡</div>
                                <div className="feat-title">Kilat</div>
                                <div className="feat-desc">Proses otomatis, hitungan detik langsung masuk.</div>
                            </div>
                            <div className="feat-card">
                                <div className="feat-icon">🔐</div>
                                <div className="feat-title">Aman</div>
                                <div className="feat-desc">Keamanan akun dan data 100% terjamin.</div>
                            </div>
                            <div className="feat-card">
                                <div className="feat-icon">💰</div>
                                <div className="feat-title">Murah</div>
                                <div className="feat-desc">Harga paling bersaing di seluruh market.</div>
                            </div>
                            <div className="feat-card">
                                <div className="feat-icon">👩‍💻</div>
                                <div className="feat-title">Support</div>
                                <div className="feat-desc">CS stand by membantu kendala Anda.</div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* TESTIMONIALS SECTION */}
                <section className="section v4-container" style={{ paddingBottom: '40px' }}>
                    <div className="section-label">APA KATA MEREKA</div>
                    <div className="testi-scroll">
                        <div className="testi-card">
                            <div className="testi-stars">★★★★★</div>
                            <div className="testi-text">"Gak nyangka secepat ini, baru klik bayar langsung masuk chipnya. Top banget!"</div>
                            <div className="testi-name">Andi Wijaya</div>
                            <div className="testi-role">Pemain Reguler</div>
                        </div>
                        <div className="testi-card">
                            <div className="testi-stars">★★★★★</div>
                            <div className="testi-text">"Udah langganan dari dulu, gak pernah ada masalah. CS-nya juga ramah-ramah."</div>
                            <div className="testi-name">Siti Aminah</div>
                            <div className="testi-role">Member VIP</div>
                        </div>
                        <div className="testi-card">
                            <div className="testi-stars">★★★★★</div>
                            <div className="testi-text">"Terpercaya buat bongkar chip jumlah besar. Rekomendasi banget buat para sultan."</div>
                            <div className="testi-name">Budi Santoso</div>
                            <div className="testi-role">Sultan Royal</div>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="landing-footer v4-container">
                    <div className="footer-logo">CLOVER STORE INDONESIA</div>
                    <div className="footer-links">
                        <Link href="/terms">Terms</Link>
                        <Link href="/privacy">Privacy</Link>
                        <Link href="/about">About Us</Link>
                        <Link href="/contact">Contact</Link>
                    </div>
                    <div className="footer-copy">© 2026 ROYAL CLOVER. POWERED BY SULTAN V4.0</div>
                </footer>

                {/* CS FLOAT */}
                <a href={config?.contacts?.whatsapp?.number ? `https://wa.me/${config.contacts.whatsapp.number}` : '#'} target="_blank" className="cs-float">
                    <span>💬 Hubungi Admin</span>
                </a>
            </main>
        </div>
    )
}
