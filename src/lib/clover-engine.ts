/**
 * Royal Clover Ops & Pricing Engine
 * Menggabungkan seluruh logika perhitungan murni dari folder web (App.jsx, calculator.js, config.js)
 */

export const LOOKUP_TABLE_BELOW_65K: [number, number][] = [
  [10000, 0.12], [11000, 0.13], [12000, 0.14], [13000, 0.15], [14000, 0.16], [15000, 0.17],
  [16000, 0.18], [17000, 0.19], [18000, 0.20], [19000, 0.21], [20000, 0.25], [21000, 0.26],
  [22000, 0.27], [23000, 0.28], [24000, 0.29], [25000, 0.35], [26000, 0.36], [27000, 0.37],
  [28000, 0.38], [29000, 0.39], [30000, 0.42], [31000, 0.43], [32000, 0.44], [32500, 0.50],
  [33000, 0.50], [34000, 0.52], [35000, 0.53], [36000, 0.54], [37000, 0.55], [38000, 0.56],
  [39000, 0.57], [40000, 0.60], [41000, 0.61], [42000, 0.62], [43000, 0.63], [44000, 0.64],
  [45000, 0.68], [46000, 0.69], [47000, 0.70], [48000, 0.71], [49000, 0.72], [50000, 0.75],
  [51000, 0.76], [52000, 0.77], [53000, 0.78], [54000, 0.79], [55000, 0.80], [56000, 0.81],
  [57000, 0.82], [58000, 0.83], [59000, 0.84], [60000, 0.90], [61000, 0.91], [62000, 0.92],
  [63000, 0.93], [64000, 0.94],
];

export const trunc2 = (x: number): number => Math.trunc(x * 100 + 1e-9) / 100;
export const rp = (n: number | string): string => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
export const num = (n: number | string): string =>
  typeof n === 'number'
    ? Number(n.toFixed(2)).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
    : (n || '0');

export const WD_BONUS = 2500;

export const FEE_COLS = ['DANA', 'OVO', 'Shopee', 'Gopay', 'Link Aja', 'BCA', 'BRI', 'Mandiri', 'SeaBank', 'Lain'] as const;
export type FeeDest = typeof FEE_COLS[number];

export const FEE_MATRIX: Record<string, number[]> = {
  BCA: [0, 0, 0, 1000, 1000, 0, 0, 0, 0, 0],
  BNI: [0, 0, 0, 1000, 1000, 0, 0, 0, 0, 0],
  Mandiri: [0, 0, 0, 1000, 1000, 0, 0, 0, 0, 0],
  BRI: [0, 0, 0, 1000, 1000, 0, 0, 0, 0, 0],
  Permata: [1000, 0, 0, 0, 1500, 0, 0, 0, 0, 0],
  SeaBank: [500, 1000, 0, 1000, 1000, 0, 0, 0, 0, 0],
};

export const REK_TO_SOURCE: Record<string, string> = {
  'BCA TAMBI': 'BCA',
  'BCA VERGA GUNAWAN': 'BCA',
  'MANDIRI VERGA GUNAWAN': 'Mandiri',
  'BRI VERGA GUNAWAN': 'BRI',
  'PERMATA TAMBI WIJAYA': 'Permata',
  'SEABANK LUFAN': 'SeaBank',
  'DANA LU FAN': 'SeaBank',
  'QRIS DANA TOKO SEJAHTERA': 'SeaBank',
  'QRIS KOPI CINTA': 'SeaBank',
};

export const mapDest = (b: string): FeeDest => {
  const x = String(b || '').toLowerCase();
  if (x.includes('dana')) return 'DANA';
  if (x.includes('ovo')) return 'OVO';
  if (x.includes('shop') || x.includes('spay')) return 'Shopee';
  if (x.includes('gopay') || x.includes('gojek')) return 'Gopay';
  if (x.includes('link')) return 'Link Aja';
  if (x.includes('bca')) return 'BCA';
  if (x.includes('bri')) return 'BRI';
  if (x.includes('mandiri')) return 'Mandiri';
  if (x.includes('sea')) return 'SeaBank';
  return 'Lain';
};

export function hitungBiayaWd(rekKita: string, bankMember: string): number {
  const src = REK_TO_SOURCE[rekKita] || 'BCA';
  const dest = mapDest(bankMember);
  const row = FEE_MATRIX[src] || FEE_MATRIX.BCA;
  const ci = (FEE_COLS as readonly string[]).indexOf(dest);
  return ci >= 0 ? row[ci] : 0;
}

export function hitungNominalWd(chip: number, rekKita: string = 'BCA TAMBI', bankMember: string = '') {
  const h = Number(chip);
  if (!h || h <= 0) return { gross: 0, nominal: 0, rate: 0, biaya: 0 };
  const rate = h < 1 ? 50000 : 60000;
  const gross = h * rate;
  const biaya = hitungBiayaWd(rekKita, bankMember);
  return { gross, biaya, nominal: gross - WD_BONUS - biaya, rate };
}

export function hitungChipTop(nominal: number | string, sr: string = '') {
  const g = Number(nominal);
  if (!g || g <= 0) return { chip: 0, rate: '-', divisor: 0 };

  const ovMap: Record<string, number> = { X62: 62000, X61: 61000, X60: 60000 };
  const ov = ovMap[sr];
  if (ov) return { chip: trunc2(g / ov), rate: sr, divisor: ov };

  if (g < 65000) {
    let chip = 0;
    for (const [nom, c] of LOOKUP_TABLE_BELOW_65K) {
      if (g >= nom) chip = c;
      else break;
    }
    return { chip, rate: 'TABEL', divisor: 0 };
  }

  if (g < 64500 * 10) return { chip: trunc2(g / 65000), rate: 'X65', divisor: 65000 };
  if (g < 64000 * 20) return { chip: trunc2(g / 64500), rate: 'X64.5', divisor: 64500 };
  if (g < 63000 * 50) return { chip: trunc2(g / 64000), rate: 'X64', divisor: 64000 };
  return { chip: trunc2(g / 63000), rate: 'X63', divisor: 63000 };
}

export interface BankAccountItem {
  id: string;
  label: string;
  saldo: number;
  no: string;
  status: 'TPWD' | 'DP' | 'LIMIT' | string;
}

export const DEFAULT_OPS_BANKS: BankAccountItem[] = [
  { id: 'bca_tambi', label: 'BCA TAMBI', saldo: 3582275, no: '1673077424', status: 'TPWD' },
  { id: 'seabank_lufan', label: 'SEABANK LUFAN', saldo: 850000, no: '901706066250', status: 'DP' },
  { id: 'qris_toko', label: 'QRIS DANA TOKO SEJAHTERA', saldo: 1642901, no: 'dana', status: 'DP' },
  { id: 'qris_kopi', label: 'QRIS KOPI CINTA', saldo: 400000, no: 'dana', status: 'DP' },
  { id: 'permata_tambi', label: 'PERMATA TAMBI WIJAYA', saldo: 2280870, no: '081xxxx', status: 'LIMIT' },
  { id: 'dana_lufan', label: 'DANA LU FAN', saldo: 530000, no: '0812xxxx', status: 'DP' },
  { id: 'bca_verga', label: 'BCA VERGA GUNAWAN', saldo: 9785000, no: '5210xxxx', status: 'TPWD' },
  { id: 'mandiri_verga', label: 'MANDIRI VERGA GUNAWAN', saldo: 845000, no: '1300xxxx', status: 'DP' },
  { id: 'bri_verga', label: 'BRI VERGA GUNAWAN', saldo: 480000, no: '0421xxxx', status: 'LIMIT' },
];

export const DEFAULT_OPS_IDS = [
  { id: 'CLOVER', chipAwal: 706.82 }
];

export function computeBankBalances(
  banks: BankAccountItem[],
  txs: {
    top?: any[];
    wd?: any[];
    transfer?: any[];
    biaya?: any[];
    dcbos?: any[];
    adj?: any[];
  }
) {
  const bal: Record<string, number> = {};
  banks.forEach((b) => (bal[b.label] = b.saldo));
  const add = (label: string, amt: number) => {
    if (bal[label] != null) bal[label] += amt;
  };

  (txs.top || []).forEach((t) => {
    if (!t.pending) add(t.bank, t.nominal);
  });
  (txs.wd || []).forEach((w) => {
    add(w.rekKita, -(w.nominal + (w.biaya || 0) + (w.bonus || 0)));
  });
  (txs.transfer || []).forEach((tf) => {
    add(tf.dari, -tf.nominal);
    add(tf.ke, tf.nominal - (tf.biaya || 0));
  });
  (txs.biaya || []).forEach((b) => add(b.rek, -b.biaya));
  (txs.dcbos || []).forEach((d) => {
    if ((d.jenis ?? 'uang') === 'uang') add(d.rek, (d.masuk || 0) - (d.keluar || 0));
  });
  (txs.adj || []).forEach((a) => {
    if (a.jenis === 'uang' && a.rek) add(a.rek, (a.sign ?? -1) * (a.salahUang || 0));
  });

  return bal;
}

export function computeBankBreakdown(
  banks: BankAccountItem[],
  txs: {
    top?: any[];
    wd?: any[];
    transfer?: any[];
    biaya?: any[];
    dcbos?: any[];
    adj?: any[];
  }
) {
  const bd: Record<string, {
    awal: number;
    topIn: number;
    wdOut: number;
    tfIn: number;
    tfOut: number;
    biayaOut: number;
    adjIn: number;
    adjOut: number;
    dcIn: number;
    dcOut: number;
  }> = {};

  banks.forEach((b) => {
    bd[b.label] = {
      awal: b.saldo,
      topIn: 0,
      wdOut: 0,
      tfIn: 0,
      tfOut: 0,
      biayaOut: 0,
      adjIn: 0,
      adjOut: 0,
      dcIn: 0,
      dcOut: 0,
    };
  });

  const g = (l: string) => bd[l];

  (txs.top || []).forEach((t) => {
    if (!t.pending && g(t.bank)) g(t.bank).topIn += t.nominal;
  });
  (txs.wd || []).forEach((w) => {
    if (g(w.rekKita)) g(w.rekKita).wdOut += (w.nominal + (w.biaya || 0) + (w.bonus || 0));
  });
  (txs.transfer || []).forEach((tf) => {
    if (g(tf.dari)) g(tf.dari).tfOut += tf.nominal;
    if (g(tf.ke)) g(tf.ke).tfIn += tf.nominal - (tf.biaya || 0);
  });
  (txs.biaya || []).forEach((b) => {
    if (g(b.rek)) g(b.rek).biayaOut += b.biaya;
  });
  (txs.dcbos || []).forEach((d) => {
    if ((d.jenis ?? 'uang') === 'uang' && g(d.rek)) {
      g(d.rek).dcIn += (d.masuk || 0);
      g(d.rek).dcOut += (d.keluar || 0);
    }
  });
  (txs.adj || []).forEach((a) => {
    if (a.jenis === 'uang' && g(a.rek)) {
      if ((a.sign ?? -1) < 0) g(a.rek).adjOut += a.salahUang || 0;
      else g(a.rek).adjIn += a.salahUang || 0;
    }
  });

  return bd;
}

export function computeChipStock(
  ids: { id: string; chipAwal: number }[],
  txs: {
    top?: any[];
    wd?: any[];
    adj?: any[];
    dcbos?: any[];
    chipTransfer?: any[];
  }
) {
  const stock: Record<string, number> = {};
  ids.forEach((x) => (stock[x.id] = x.chipAwal));
  const def = ids[0]?.id || 'CLOVER';

  (txs.top || []).forEach((t) => {
    if (!t.pending) stock[t.idAkun || def] = (stock[t.idAkun || def] || 0) - t.chip;
  });
  (txs.wd || []).forEach((w) => {
    stock[w.idAkun || def] = (stock[w.idAkun || def] || 0) + w.chip;
  });
  (txs.adj || []).forEach((a) => {
    if ((a.jenis ?? 'chip') === 'chip') {
      stock[a.idAkun || def] = (stock[a.idAkun || def] || 0) + (a.sign ?? -1) * (a.salahChip || 0);
    }
  });
  (txs.chipTransfer || []).forEach((c) => {
    stock[c.dari] = (stock[c.dari] || 0) - c.chip;
    stock[c.ke] = (stock[c.ke] || 0) + c.chip;
  });
  (txs.dcbos || []).forEach((d) => {
    if (d.jenis === 'chip') {
      stock[d.idAkun || def] = (stock[d.idAkun || def] || 0) + (d.masuk || 0) - (d.keluar || 0);
    }
  });

  Object.keys(stock).forEach((k) => {
    stock[k] = Math.round((stock[k] + Number.EPSILON) * 100) / 100;
  });

  return stock;
}
