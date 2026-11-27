import React from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
} from '../../data/initialData';
import { MonthlyTarget, MosqueSettings, Transaction } from '../../types';
import {
  exportTransactionsToCSV,
  formatPercent,
  formatRupiah,
  getMonthKey,
} from '../../utils/formatters';

interface LaporanViewProps {
  transactions: Transaction[];
  monthlyTargets: MonthlyTarget[];
  selectedPeriod: string;
  settings: MosqueSettings;
}

export function LaporanView({
  transactions,
  monthlyTargets,
  selectedPeriod,
  settings,
}: LaporanViewProps) {
  const periodTransactions =
    selectedPeriod === 'all'
      ? transactions
      : transactions.filter((t) => getMonthKey(t.date) === selectedPeriod);

  const periodLabel =
    selectedPeriod === 'all'
      ? 'Juni – November 2026 (6 Bulan)'
      : monthlyTargets.find((m) => m.monthKey === selectedPeriod)?.fullLabel ||
        selectedPeriod;

  const incomeRows = INCOME_SOURCES.map((src) => {
    const sum = periodTransactions
      .filter((t) => t.type === 'pemasukan' && t.category === src)
      .reduce((s, t) => s + t.amount, 0);
    return { label: src, amount: sum };
  });

  const expenseRows = EXPENSE_CATEGORIES.map((cat) => {
    const sum = periodTransactions
      .filter((t) => t.type === 'pengeluaran' && t.category === cat)
      .reduce((s, t) => s + t.amount, 0);
    return { label: cat, amount: sum };
  });

  const totalIncome = incomeRows.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expenseRows.reduce((s, r) => s + r.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Monthly recap table
  const monthlyRecap = monthlyTargets.map((m) => {
    const inc = transactions
      .filter(
        (t) => t.type === 'pemasukan' && getMonthKey(t.date) === m.monthKey
      )
      .reduce((s, t) => s + t.amount, 0);
    const exp = transactions
      .filter(
        (t) => t.type === 'pengeluaran' && getMonthKey(t.date) === m.monthKey
      )
      .reduce((s, t) => s + t.amount, 0);
    return {
      ...m,
      income: inc,
      expense: exp,
      balance: inc - exp,
      achievement: m.targetAmount > 0 ? (inc / m.targetAmount) * 100 : 0,
    };
  });

  return (
    <div className="space-y-4 print-full">
      {/* Action Header */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)]">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-full bg-[#0E6B43] text-white flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[#0F2E1F]">
              Laporan Keuangan Kas Masjid
            </h2>
            <p className="text-xs text-[#5D7366]">
              Periode laporan: {periodLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D4E2DA] bg-white px-4 py-2 text-sm font-semibold text-[#234836] hover:bg-[#F3F8F5] transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>
          <button
            type="button"
            onClick={() =>
              exportTransactionsToCSV(
                periodTransactions,
                `laporan-keuangan-${selectedPeriod}.csv`
              )
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#0E6B43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B5535] transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Printable Financial Statement */}
      <div className="rounded-2xl border border-[#DCE8E0] bg-white p-6 sm:p-8 shadow-[0_2px_10px_rgba(12,62,38,0.04)] space-y-6">
        <div className="border-b-2 border-[#0E6B43] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-[#0E6B43] tracking-wide">
              LAPORAN PERTANGGUNGJAWABAN KEUANGAN
            </p>
            <h3 className="text-xl font-bold text-[#0F2E1F] mt-0.5">
              {settings.mosqueName} — {settings.institutionName}
            </h3>
          </div>
          <p className="text-sm font-semibold text-[#3D5549]">
            Periode: {periodLabel}
          </p>
        </div>

        {/* Two-Column Income & Expense Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pemasukan Statement */}
          <div className="rounded-xl border border-[#E3ECE6] p-4">
            <h4 className="text-sm font-bold text-[#0E6B43] pb-2 border-b border-[#E3ECE6]">
              A. Penerimaan / Pemasukan Kas
            </h4>
            <div className="mt-3 space-y-2.5 text-sm">
              {incomeRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-[#2B4839]">{row.label}</span>
                  <span className="font-semibold text-[#0F2E1F] tabular-nums">
                    {formatRupiah(row.amount)}
                  </span>
                </div>
              ))}
              <div className="pt-2.5 mt-2 border-t border-[#E3ECE6] flex items-center justify-between font-bold text-[#0E6B43]">
                <span>Total Pemasukan</span>
                <span className="tabular-nums">{formatRupiah(totalIncome)}</span>
              </div>
            </div>
          </div>

          {/* Pengeluaran Statement */}
          <div className="rounded-xl border border-[#E3ECE6] p-4">
            <h4 className="text-sm font-bold text-[#D95D41] pb-2 border-b border-[#E3ECE6]">
              B. Penyaluran / Pengeluaran Kas
            </h4>
            <div className="mt-3 space-y-2.5 text-sm">
              {expenseRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-[#2B4839]">{row.label}</span>
                  <span className="font-semibold text-[#0F2E1F] tabular-nums">
                    {formatRupiah(row.amount)}
                  </span>
                </div>
              ))}
              <div className="pt-2.5 mt-2 border-t border-[#E3ECE6] flex items-center justify-between font-bold text-[#D95D41]">
                <span>Total Pengeluaran</span>
                <span className="tabular-nums">
                  {formatRupiah(totalExpense)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Balance Highlight */}
        <div className="rounded-xl bg-[#EEF6F1] border border-[#CBE2D4] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-[#4A6658]">
              Surplus / Saldo Akhir Periode ({periodLabel})
            </p>
            <p className="text-xs text-[#5D7366] mt-0.5">
              Selisih Total Pemasukan dikurangi Total Pengeluaran
            </p>
          </div>
          <p className="text-2xl font-bold text-[#0E6B43] tabular-nums">
            {formatRupiah(netBalance)}
          </p>
        </div>

        {/* 6-Month Recap Table */}
        <div>
          <h4 className="text-sm font-bold text-[#0F2E1F] mb-3">
            Rekapitulasi Arus Kas 6 Bulan Terakhir
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E3ECE6] bg-[#F4F8F5] text-xs font-semibold text-[#2B4839]">
                  <th className="py-2.5 px-3 rounded-tl-lg">Bulan</th>
                  <th className="py-2.5 px-3 text-right">Target Pemasukan</th>
                  <th className="py-2.5 px-3 text-right">Realisasi</th>
                  <th className="py-2.5 px-3 text-right">Capaian</th>
                  <th className="py-2.5 px-3 text-right">Pengeluaran</th>
                  <th className="py-2.5 px-3 text-right rounded-tr-lg">
                    Saldo Bersih
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3EF]">
                {monthlyRecap.map((m) => (
                  <tr key={m.monthKey} className="hover:bg-[#F7FBF8]">
                    <td className="py-2.5 px-3 font-medium text-[#0F2E1F]">
                      {m.fullLabel}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#4A6658] tabular-nums">
                      {formatRupiah(m.targetAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#0E6B43] tabular-nums">
                      {formatRupiah(m.income)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#2B4839] tabular-nums">
                      {formatPercent(m.achievement)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#D95D41] tabular-nums">
                      {formatRupiah(m.expense)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#0F2E1F] tabular-nums">
                      {formatRupiah(m.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sign-off Block */}
        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-[#E3ECE6] text-center text-sm text-[#2B4839]">
          <div>
            <p className="text-xs text-[#5D7366]">Mengetahui, Ketua Takmir</p>
            <p className="mt-10 font-bold text-[#0F2E1F]">
              {settings.takmirLead}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#5D7366]">Dibuat oleh, Bendahara</p>
            <p className="mt-10 font-bold text-[#0F2E1F]">
              {settings.treasurerName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
