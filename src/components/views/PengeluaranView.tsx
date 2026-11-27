import React, { useMemo } from 'react';
import { ArrowDown, ArrowRight, Plus } from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_COLORS,
} from '../../data/initialData';
import { NavPage, Transaction, UserRole } from '../../types';
import {
  formatDateID,
  formatPercent,
  formatRupiah,
  getMonthKey,
} from '../../utils/formatters';
import { DonutChart } from '../Charts';

interface PengeluaranViewProps {
  transactions: Transaction[];
  selectedPeriod: string;
  userRole: UserRole;
  onAddExpense: () => void;
  onNavigate: (page: NavPage) => void;
}

export function PengeluaranView({
  transactions,
  selectedPeriod,
  userRole,
  onAddExpense,
  onNavigate,
}: PengeluaranViewProps) {
  const canModify = userRole !== 'Jamaah';

  const expenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'pengeluaran')
      .filter((t) =>
        selectedPeriod === 'all' ? true : getMonthKey(t.date) === selectedPeriod
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedPeriod]);

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);

  const categoryStats = EXPENSE_CATEGORIES.map((cat) => {
    const items = expenses.filter((t) => t.category === cat);
    const sum = items.reduce((s, t) => s + t.amount, 0);
    const pct = totalExpense > 0 ? (sum / totalExpense) * 100 : 0;
    return {
      category: cat,
      count: items.length,
      sum,
      pct,
      color: EXPENSE_CATEGORY_COLORS[cat],
    };
  });

  const slices = categoryStats.map((c) => ({
    label: c.category,
    value: c.sum,
    color: c.color,
  }));

  return (
    <div className="space-y-4">
      {/* Category Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categoryStats.map((stat) => (
          <div
            key={stat.category}
            className="rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)]"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: stat.color }}
                />
                <h3 className="text-sm font-semibold text-[#2B4839]">
                  {stat.category}
                </h3>
              </div>
              <span className="text-xs font-bold text-[#0F2E1F] tabular-nums">
                {formatPercent(stat.pct)}
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#0F2E1F] tabular-nums">
              {formatRupiah(stat.sum)}
            </p>
            <p className="mt-1 text-xs text-[#5D7366]">
              {stat.count} transaksi tercatat
            </p>
            <div className="mt-3 h-2 w-full rounded-full bg-[#EEF4F0] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(2, stat.pct))}%`,
                  backgroundColor: stat.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Main Analytics + Recent List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#D95D41] text-white flex items-center justify-center">
                <ArrowDown className="w-4 h-4" />
              </span>
              <h2 className="text-[17px] font-bold text-[#0F2E1F]">
                Proporsi Pengeluaran
              </h2>
            </div>
            {canModify && (
              <button
                type="button"
                onClick={onAddExpense}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#D95D41] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#C24D33] transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Pengeluaran</span>
              </button>
            )}
          </div>

          <div className="flex flex-col items-center justify-center py-3 gap-5">
            <DonutChart slices={slices} total={totalExpense} size={190} />
            <div className="w-full space-y-2.5 border-t border-[#EEF3EF] pt-4">
              {categoryStats.map((c) => (
                <div
                  key={c.category}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 text-[#243E31] font-medium">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.category}
                  </span>
                  <span className="font-semibold text-[#0F2E1F] tabular-nums">
                    {formatRupiah(c.sum)} ({formatPercent(c.pct)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-[17px] font-bold text-[#0F2E1F]">
              Pengeluaran Terbaru
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('rincian-pengeluaran')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4E2DA] bg-[#F8FBF9] px-3 py-1.5 text-xs font-semibold text-[#234836] hover:bg-[#EAF3EE] transition-colors"
            >
              <span>Kelola Semua Rincian</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3ECE6] bg-[#F4F8F5] text-xs font-semibold text-[#2B4839]">
                  <th className="py-2.5 px-3 rounded-tl-lg">Tanggal</th>
                  <th className="py-2.5 px-3">Uraian</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right rounded-tr-lg">
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3EF] text-sm">
                {expenses.slice(0, 8).map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-[#F7FBF8] transition-colors"
                  >
                    <td className="py-2.5 px-3 text-[#3D5549] tabular-nums whitespace-nowrap">
                      {formatDateID(row.date)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#0F2E1F]">
                      {row.description}
                    </td>
                    <td className="py-2.5 px-3 text-[#3D5549] whitespace-nowrap">
                      {row.category}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#0F2E1F] tabular-nums whitespace-nowrap">
                      {formatRupiah(row.amount)}
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-[#5D7366]"
                    >
                      Belum ada pengeluaran pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
