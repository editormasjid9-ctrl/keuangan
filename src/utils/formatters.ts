import { Transaction } from '../types';

export function formatRupiah(amount: number): string {
  const abs = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID').format(abs);
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function formatMillions(amount: number): string {
  const jt = amount / 1_000_000;
  return `${jt.toFixed(1).replace('.', ',')} jt`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

export function formatDateID(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function getMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

export function computePercentDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  filename: string
): void {
  const headers = [
    'Tanggal',
    'Jenis',
    'Uraian',
    'Kategori / Sumber',
    'Jumlah (Rp)',
    'Penanggung Jawab',
    'Catatan',
  ];
  const rows = transactions.map((t) => [
    formatDateID(t.date),
    t.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${t.category}"`,
    t.amount.toString(),
    `"${(t.pic || '-').replace(/"/g, '""')}"`,
    `"${(t.notes || '-').replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
