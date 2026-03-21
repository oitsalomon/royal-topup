'use client';
import React, { useState } from 'react';

export default function TopUpPage() {
  const [selected, setSelected] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [status, setStatus] = useState<{ show: boolean, warn: boolean, text: string }>({ show: false, warn: false, text: '' });

  const selectPkg = (amount: number) => {
    setSelected(amount);
    setCustomAmount('');
    setStatus({ show: true, warn: false, text: '' });
  };

  const onCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setSelected(0);
    setStatus({ show: false, warn: false, text: '' });
  };

  const useCustom = () => {
    const val = parseInt(customAmount);
    if (!val || val < 10000) {
      setStatus({ show: true, warn: true, text: 'Minimal nominal Rp 10.000' });
      return;
    }
    setSelected(val);
    setStatus({ show: true, warn: false, text: '' });
  };

  const bukaSaweria = () => {
    if (!selected) return;
    window.open('https://saweria.co/Royalclover', '_blank');
    setStatus({
      show: true,
      warn: false,
      text: `Saweria dibuka! Isi nominal Rp ${selected.toLocaleString('id-ID')} lalu pilih metode bayar.`
    });
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center">
      <style dangerouslySetInnerHTML={{__html: `
        .topup-wrap { max-width: 420px; width: 100%; margin: 0 auto; font-family: 'DM Sans', sans-serif; background: #0f1117; color: #fff; padding: 2rem 1.5rem; border-radius: 16px; border: 1px solid #2a2d3a; }
        .logo-section { display: flex; align-items: center; gap: 10px; margin-bottom: 2rem; }
        .logo-icon { width: 40px; height: 40px; background: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .logo-text { font-family: var(--font-outfit), 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #fff; }
        .logo-sub { font-size: 12px; color: #888; }
        .section-title { font-size: 12px; color: #888; margin-bottom: 12px; letter-spacing: .08em; text-transform: uppercase; }
        .packages { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 1.5rem; }
        .pkg { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 12px; padding: 16px; cursor: pointer; transition: border-color .15s, transform .1s; position: relative; text-align: left; }
        .pkg:hover { border-color: #16a34a; transform: translateY(-1px); }
        .pkg.selected { border: 2px solid #16a34a; background: #0f2318; }
        .pkg-chip { font-size: 11px; font-weight: 500; color: #16a34a; margin-bottom: 6px; }
        .pkg-price { font-size: 22px; font-weight: 700; font-family: var(--font-outfit), 'Syne', sans-serif; color: #fff; }
        .pkg-price span { font-size: 12px; font-weight: 400; color: #888; }
        .pkg-label { font-size: 11px; color: #666; margin-top: 2px; }
        .popular-badge { position: absolute; top: 10px; right: 10px; background: #14532d; color: #4ade80; font-size: 10px; font-weight: 500; padding: 2px 8px; border-radius: 20px; }
        .divider { height: 1px; background: #2a2d3a; margin: 1.2rem 0; }
        .custom-input-row { display: flex; gap: 8px; align-items: center; margin-bottom: 1.5rem; }
        .custom-input-row input { flex: 1; padding: 12px; border: 1px solid #2a2d3a; border-radius: 10px; font-size: 15px; background: #1a1d27; color: #fff; outline: none; }
        .custom-input-row input:focus { border-color: #16a34a; }
        .custom-input-row button { padding: 12px 16px; background: #16a34a; color: #fff; border: none; border-radius: 10px; font-size: 14px; cursor: pointer; }
        .btn-bayar { width: 100%; padding: 15px; background: #16a34a; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 500; cursor: pointer; transition: opacity .15s; margin-bottom: 10px; }
        .btn-bayar:hover { opacity: .9; }
        .btn-bayar:disabled { opacity: .3; cursor: not-allowed; }
        .status-box { margin-top: 10px; padding: 12px; border-radius: 10px; font-size: 13px; display: none; background: #1a2f1e; color: #4ade80; }
        .status-box.show { display: block; }
        .status-box.warn { background: #2f1a1a; color: #f87171; display: block; }
        .note-txt { font-size: 12px; color: #555; text-align: center; margin-top: 14px; line-height: 1.6; }
      `}} />
      <div className="topup-wrap shadow-2xl shadow-emerald-900/10 z-10">
        <div className="logo-section">
          <div className="logo-icon">🍀</div>
          <div>
            <div className="logo-text">Royal Clover</div>
            <div className="logo-sub">Top up chip cepat & terpercaya</div>
          </div>
        </div>

        <div className="section-title">pilih paket chip</div>
        <div className="packages">
          <div className={`pkg ${selected === 50000 ? 'selected' : ''}`} onClick={() => selectPkg(50000)}>
            <div className="pkg-chip">Chip Starter</div>
            <div className="pkg-price">50<span>rb</span></div>
            <div className="pkg-label">Rp 50.000</div>
          </div>
          <div className={`pkg ${selected === 100000 ? 'selected' : ''}`} onClick={() => selectPkg(100000)}>
            <div className="pkg-chip">Chip Regular</div>
            <div className="pkg-price">100<span>rb</span></div>
            <div className="pkg-label">Rp 100.000</div>
            <div className="popular-badge">Populer</div>
          </div>
          <div className={`pkg ${selected === 200000 ? 'selected' : ''}`} onClick={() => selectPkg(200000)}>
            <div className="pkg-chip">Chip Pro</div>
            <div className="pkg-price">200<span>rb</span></div>
            <div className="pkg-label">Rp 200.000</div>
          </div>
          <div className={`pkg ${selected === 500000 ? 'selected' : ''}`} onClick={() => selectPkg(500000)}>
            <div className="pkg-chip">Chip King</div>
            <div className="pkg-price">500<span>rb</span></div>
            <div className="pkg-label">Rp 500.000</div>
          </div>
        </div>

        <div className="divider"></div>
        <div className="section-title" style={{ marginTop: '1rem' }}>atau nominal bebas</div>
        
        <div className="custom-input-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1.5rem' }}>
          <input 
            type="number" 
            placeholder="contoh: 150000" 
            min="10000" 
            step="1000"
            value={customAmount}
            onChange={onCustomInput}
            style={{ flex: 1, padding: '12px', border: '1px solid #2a2d3a', borderRadius: '10px', fontSize: '15px', background: '#1a1d27', color: '#fff', outline: 'none' }}
          />
          <button onClick={useCustom} style={{ padding: '12px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>Pakai</button>
        </div>

        <button 
          className="btn-bayar" 
          disabled={!selected} 
          onClick={bukaSaweria}
          style={{ width: '100%', padding: '15px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 500, cursor: selected ? 'pointer' : 'not-allowed', opacity: selected ? 1 : 0.3, marginBottom: '10px' }}
        >
          {selected ? `Bayar Rp ${selected.toLocaleString('id-ID')} via Saweria` : 'Pilih paket dulu'}
        </button>

        {status.show && (
          <div className={`status-box show ${status.warn ? 'warn' : ''}`}>
            {status.text}
          </div>
        )}

        <div className="note-txt">
          Setelah bayar di Saweria, chip dikirim manual oleh admin.<br/>Simpan bukti bayar ya! 🍀
        </div>
      </div>
    </div>
  );
}
