import React, { useMemo, useState } from 'react';
import {
  Download,
  Edit2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { INCOME_SOURCES, INCOME_SOURCE_COLORS } from '../../data/initialData';
import { MonthlyTarget, Transaction, UserRole } from '../../types';
import {
  exportTransactionsToCSV,
  formatDateID,
  formatPercent,
  formatRupiah,
  getMonthKey,
} from '../../utils/formatters';
import { IncomeTargetBarChart, MonthlyBarItem } from '../Charts';

interface PemasukanViewProps {
  transactions: Transaction[];
  monthlyTargets: MonthlyTarget[];
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
  userRole: UserRole;
  onAddIncome: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export function PemasukanView({
  transactions,
  monthlyTargets,
  selectedPeriod,
  onSelectPeriod,
  userRole,
  onAddIncome,
  onEditTransaction,
  onDeleteTransaction,
}: PemasukanViewProps) {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const canModify = userRole !== 'Jamaah';
  const activeMonthKey = selectedPeriod === 'all' ? '2026-11' : selectedPeriod;

  const incomeTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'pemasukan')
      .filter((t) =>
        selectedPeriod === 'all' ? true : getMonthKey(t.date) === selectedPeriod
      )
      .filter((t) =>
        sourceFilter === 'all' ? true : t.category === sourceFilter
      )
      .filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.pic || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedPeriod, sourceFilter, search]);

  const totalPeriodIncome = incomeTransactions.reduce(
    (s, t) => s + t.amount,
    0
  );

  const targetObj =
    monthlyTargets.find((m) => m.monthKey === activeMonthKey) ||
    monthlyTargets[monthlyTargets.length - 1];
  const targetAmount =
    selectedPeriod === 'all'
      ? monthlyTargets.reduce((s, m) => s + m.targetAmount, 0)
      : targetObj.targetAmount;

  const allIncomeForPeriod = transactions
    .filter((t) => t.type === 'pemasukan')
    .filter((t) =>
      selectedPeriod === 'all' ? true : getMonthKey(t.date) === selectedPeriod
    );
  const fullPeriodTotal = allIncomeForPeriod.reduce((s, t) => s + t.amount, 0);
  const pct = targetAmount > 0 ? (fullPeriodTotal / targetAmount) * 100 : 0;

  const barData: MonthlyBarItem[] = monthlyTargets.map((m) => ({
    monthKey: m.monthKey,
    label: m.label,
    fullLabel: m.fullLabel,
    target: m.targetAmount,
    realized: transactions
      .filter(
        (t) => t.type === 'pemasukan' && getMonthKey(t.date) === m.monthKey
      )
      .reduce((s, t) => s + t.amount, 0),
  }));

  return (
    <div className="space-y-4">
      {/* Top Action & Summary Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-full bg-[#168C55] text-white flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-medium text-[#5D7366]">
                    Total Realisasi Pemasukan
                  </p>
                  <p className="text-2xl font-bold text-[#0F2E1F] tabular-nums">
                    {formatRupiah(fullPeriodTotal)}
                  </p>
                </div>
              </div>
              <span className="rounded-lg bg-[#E4F2EA] px-3 py-1 text-xs font-bold text-[#0E6B43] tabular-nums">
                {formatPercent(pct)}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-medium text-[#4A6658]">
                <span>Target Periode</span>
                <span className="font-semibold text-[#0F2E1F] tabular-nums">
                  {formatRupiah(targetAmount)}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E3EEE7]">
                <div
                  className="h-full rounded-full bg-[#168C55] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {canModify && (
              <button
                type="button"
                onClick={onAddIncome}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0E6B43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B5535] transition-colors shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pemasukan</span>
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                exportTransactionsToCSV(
                  incomeTransactions,
                  `pemasukan-masjid-${selectedPeriod}.csv`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-[#D4E2DA] bg-white px-4 py-2 text-sm font-semibold text-[#234836] hover:bg-[#F3F8F5] transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[15px] font-bold text-[#0F2E1F]">
              Tren Target vs Realisasi (Jun – Nov 2026)
            </h3>
            <div className="flex items-center gap-4 text-xs text-[#4A6658]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B8C8C2]" />
                Target
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0E6B43]" />
                Realisasi
              </span>
            </div>
          </div>
          <IncomeTargetBarChart
            data={barData}
            selectedMonthKey={activeMonthKey}
            onSelectMonth={onSelectPeriod}
          />
        </div>
      </div>

      {/* Filter & Ledger Table */}
      <div className="rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#EEF4F0] p-1">
            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                sourceFilter === 'all'
                  ? 'bg-white text-[#0F2E1F] shadow-xs'
                  : 'text-[#4A6658] hover:text-[#0F2E1F]'
              }`}
            >
              Semua Sumber
            </button>
            {INCOME_SOURCES.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setSourceFilter(src)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  sourceFilter === src
                    ? 'bg-white text-[#0F2E1F] shadow-xs'
                    : 'text-[#4A6658] hover:text-[#0F2E1F]'
                }`}
              >
                {src}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#6B8477] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari uraian pemasukan..."
              className="w-full rounded-xl border border-[#D4E2DA] bg-[#F8FBF9] pl-9 pr-3 py-2 text-sm text-[#0F2E1F] placeholder:text-[#869B8F] focus:bg-white focus:border-[#0E6B43] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E3ECE6] bg-[#F4F8F5] text-xs font-semibold text-[#2B4839]">
                <th className="py-3 px-3 rounded-tl-lg">Tanggal</th>
                <th className="py-3 px-3">Uraian Pemasukan</th>
                <th className="py-3 px-3">Sumber Dana</th>
                <th className="py-3 px-3">Penanggung Jawab</th>
                <th className="py-3 px-3 text-right">Jumlah</th>
                {canModify && (
                  <th className="py-3 px-3 text-right rounded-tr-lg">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF3EF] text-sm">
              {incomeTransactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={canModify ? 6 : 5}
                    className="py-10 text-center text-[#5D7366]"
                  >
                    <p className="font-medium">
                      Tidak ada data pemasukan yang sesuai filter.
                    </p>
                    {canModify && (
                      <button
                        type="button"
                        onClick={onAddIncome}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#0E6B43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5535]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Catat Pemasukan Pertama
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                incomeTransactions.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#F7FBF8] transition-colors"
                  >
                    <td className="py-3 px-3 text-[#3D5549] tabular-nums whitespace-nowrap">
                      {formatDateID(row.date)}
                    </td>
                    <td className="py-3 px-3 font-medium text-[#0F2E1F]">
                      {row.description}
                    </td>
                    <td className="py-3 px-3 text-[#3D5549] whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              INCOME_SOURCE_COLORS[
                                row.category as keyof typeof INCOME_SOURCE_COLORS
                              ] || '#168C55',
                          }}
                        />
                        {row.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#5D7366] whitespace-nowrap">
                      {row.pic || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-[#0E6B43] tabular-nums whitespace-nowrap">
                      {formatRupiah(row.amount)}
                    </td>
                    {canModify && (
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditTransaction(row)}
                            className="rounded-lg p-1.5 text-[#4A6658] hover:bg-[#E7EFEA] hover:text-[#0F2E1F]"
                            title="Edit transaksi"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(row.id)}
                            className="rounded-lg p-1.5 text-[#4A6658] hover:bg-red-50 hover:text-red-600"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {incomeTransactions.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-[#DCE8E0] bg-[#F6FAF7] text-sm font-bold text-[#0F2E1F]">
                  <td colSpan={4} className="py-3 px-3">
                    Total Terfilter ({incomeTransactions.length} transaksi)
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-[#0E6B43]">
                    {formatRupiah(totalPeriodIncome)}
                  </td>
                  {canModify && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
