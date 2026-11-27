import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  BarChart2,
  List,
  Megaphone,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_COLORS,
  INCOME_SOURCES,
  INCOME_SOURCE_COLORS,
} from '../../data/initialData';
import {
  MonthlyTarget,
  MosqueSettings,
  NavPage,
  Transaction,
} from '../../types';
import {
  computePercentDelta,
  formatDateID,
  formatPercent,
  formatRupiah,
  getMonthKey,
} from '../../utils/formatters';
import {
  DonutChart,
  IncomeTargetBarChart,
  KpiSparkline,
  MonthlyBarItem,
} from '../Charts';
import { FooterBadgeEmblem } from '../MosqueArtwork';

interface DashboardViewProps {
  transactions: Transaction[];
  monthlyTargets: MonthlyTarget[];
  selectedPeriod: string; // YYYY-MM or 'all'
  onSelectPeriod: (period: string) => void;
  onNavigate: (page: NavPage) => void;
  settings: MosqueSettings;
}

export function DashboardView({
  transactions,
  monthlyTargets,
  selectedPeriod,
  onSelectPeriod,
  onNavigate,
  settings,
}: DashboardViewProps) {
  const activeMonthKey =
    selectedPeriod === 'all' ? '2026-11' : selectedPeriod;

  const periodTransactions =
    selectedPeriod === 'all'
      ? transactions
      : transactions.filter((t) => getMonthKey(t.date) === selectedPeriod);

  const totalIncome = periodTransactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = periodTransactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Previous month delta calculation
  const monthIdx = monthlyTargets.findIndex(
    (m) => m.monthKey === activeMonthKey
  );
  const prevMonthKey = monthIdx > 0 ? monthlyTargets[monthIdx - 1].monthKey : null;

  const prevIncome = prevMonthKey
    ? transactions
        .filter(
          (t) => t.type === 'pemasukan' && getMonthKey(t.date) === prevMonthKey
        )
        .reduce((s, t) => s + t.amount, 0)
    : 0;
  const prevExpense = prevMonthKey
    ? transactions
        .filter(
          (t) =>
            t.type === 'pengeluaran' && getMonthKey(t.date) === prevMonthKey
        )
        .reduce((s, t) => s + t.amount, 0)
    : 0;
  const prevBalance = prevIncome - prevExpense;

  const incomeDelta =
    selectedPeriod === 'all'
      ? null
      : computePercentDelta(totalIncome, prevIncome);
  const expenseDelta =
    selectedPeriod === 'all'
      ? null
      : computePercentDelta(totalExpense, prevExpense);
  const balanceDelta =
    selectedPeriod === 'all'
      ? null
      : computePercentDelta(balance, prevBalance);

  // Sparkline series across all 6 months
  const incomeSeries = monthlyTargets.map((m) =>
    transactions
      .filter(
        (t) => t.type === 'pemasukan' && getMonthKey(t.date) === m.monthKey
      )
      .reduce((s, t) => s + t.amount, 0)
  );
  const expenseSeries = monthlyTargets.map((m) =>
    transactions
      .filter(
        (t) => t.type === 'pengeluaran' && getMonthKey(t.date) === m.monthKey
      )
      .reduce((s, t) => s + t.amount, 0)
  );
  const balanceSeries = monthlyTargets.map(
    (_, idx) => incomeSeries[idx] - expenseSeries[idx]
  );

  // Monthly Bar Chart data
  const barChartData: MonthlyBarItem[] = monthlyTargets.map((m) => ({
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

  const currentTargetObj =
    monthlyTargets.find((m) => m.monthKey === activeMonthKey) ||
    monthlyTargets[monthlyTargets.length - 1];

  const targetForDisplay =
    selectedPeriod === 'all'
      ? monthlyTargets.reduce((s, m) => s + m.targetAmount, 0)
      : currentTargetObj.targetAmount;

  const achievementPct =
    targetForDisplay > 0 ? (totalIncome / targetForDisplay) * 100 : 0;

  // Expense Donut Slices
  const expenseSlices = EXPENSE_CATEGORIES.map((cat) => ({
    label: cat,
    value: periodTransactions
      .filter((t) => t.type === 'pengeluaran' && t.category === cat)
      .reduce((s, t) => s + t.amount, 0),
    color: EXPENSE_CATEGORY_COLORS[cat],
  }));

  // Income Source Donut Slices
  const incomeSourceSlices = INCOME_SOURCES.map((src) => ({
    label: src,
    value: periodTransactions
      .filter((t) => t.type === 'pemasukan' && t.category === src)
      .reduce((s, t) => s + t.amount, 0),
    color: INCOME_SOURCE_COLORS[src],
  }));

  // Top 5 latest expenses
  const latestExpenses = [...periodTransactions]
    .filter((t) => t.type === 'pengeluaran')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const renderDelta = (delta: number | null, tone: 'green' | 'amber') => {
    if (delta === null) {
      return (
        <span className="text-xs font-medium text-[#5D7366]">
          Akumulasi 6 bulan
        </span>
      );
    }
    const isUp = delta >= 0;
    const rounded = Math.round(Math.abs(delta));
    const colorClass =
      tone === 'green'
        ? isUp
          ? 'text-[#15803D]'
          : 'text-amber-700'
        : isUp
        ? 'text-[#D97706]'
        : 'text-[#15803D]';
    return (
      <span className={`text-xs font-semibold ${colorClass}`}>
        {isUp ? '▲' : '▼'} {rounded}% dari bulan lalu
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Row 1: 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Pemasukan */}
        <div className="relative overflow-hidden rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] flex items-center justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#168C55] text-white flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#4A6658]">
                Total Pemasukan
              </p>
              <p className="mt-0.5 text-[22px] sm:text-[24px] font-bold tracking-tight text-[#0F2E1F] tabular-nums whitespace-nowrap">
                {formatRupiah(totalIncome)}
              </p>
              <div className="mt-1">{renderDelta(incomeDelta, 'green')}</div>
            </div>
          </div>
          <div className="self-end">
            <KpiSparkline
              id="income"
              points={incomeSeries}
              strokeColor="#168C55"
              fillColor="#168C55"
            />
          </div>
        </div>

        {/* Card 2: Total Pengeluaran */}
        <div className="relative overflow-hidden rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] flex items-center justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#EA7A24] text-white flex items-center justify-center shrink-0 shadow-xs">
              <ArrowDown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#4A6658]">
                Total Pengeluaran
              </p>
              <p className="mt-0.5 text-[22px] sm:text-[24px] font-bold tracking-tight text-[#0F2E1F] tabular-nums whitespace-nowrap">
                {formatRupiah(totalExpense)}
              </p>
              <div className="mt-1">{renderDelta(expenseDelta, 'amber')}</div>
            </div>
          </div>
          <div className="self-end">
            <KpiSparkline
              id="expense"
              points={expenseSeries}
              strokeColor="#EA7A24"
              fillColor="#EA7A24"
            />
          </div>
        </div>

        {/* Card 3: Saldo Akhir */}
        <div className="relative overflow-hidden rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] flex items-center justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#0E6B43] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-[#4A6658]">
                Saldo Akhir
              </p>
              <p className="mt-0.5 text-[22px] sm:text-[24px] font-bold tracking-tight text-[#0F2E1F] tabular-nums whitespace-nowrap">
                {formatRupiah(balance)}
              </p>
              <div className="mt-1">{renderDelta(balanceDelta, 'green')}</div>
            </div>
          </div>
          <div className="self-end">
            <KpiSparkline
              id="balance"
              points={balanceSeries}
              strokeColor="#168C55"
              fillColor="#168C55"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Pemasukan Bar Chart + Pengeluaran Donut Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Pemasukan Card */}
        <section className="xl:col-span-7 rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#168C55] text-white flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h2 className="text-[17px] font-bold text-[#0F2E1F]">
                Pemasukan
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('pemasukan')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4E2DA] bg-[#F8FBF9] px-3 py-1.5 text-xs font-semibold text-[#234836] hover:bg-[#EAF3EE] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Lihat Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-5 text-xs font-medium text-[#4A6658] mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B8C8C2]" />
              <span>Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0E6B43]" />
              <span>Realisasi</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8">
              <IncomeTargetBarChart
                data={barChartData}
                selectedMonthKey={activeMonthKey}
                onSelectMonth={(mk) => onSelectPeriod(mk)}
              />
            </div>

            {/* Right Target vs Realisasi Summary */}
            <div className="md:col-span-4 space-y-3 border-t md:border-t-0 md:border-l border-[#E8F0EB] pt-3 md:pt-0 md:pl-4">
              <div>
                <p className="text-xs font-medium text-[#5D7366]">
                  {selectedPeriod === 'all'
                    ? 'Total Target (6 Bln)'
                    : 'Target Bulan Ini'}
                </p>
                <p className="text-[18px] font-bold text-[#0F2E1F] tabular-nums mt-0.5">
                  {formatRupiah(targetForDisplay)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#5D7366]">Realisasi</p>
                <p className="text-[18px] font-bold text-[#0F2E1F] tabular-nums mt-0.5">
                  {formatRupiah(totalIncome)}
                </p>
              </div>
              <div className="pt-1">
                <div className="h-3 w-full overflow-hidden rounded-full bg-[#E3EEE7]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#168C55] to-[#0B5E3A] transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(4, achievementPct))}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-center">
                  <span className="rounded-lg bg-[#E4F2EA] px-3 py-1 text-sm font-bold text-[#0E6B43] tabular-nums">
                    {formatPercent(achievementPct)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pengeluaran Card */}
        <section className="xl:col-span-5 rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#D95D41] text-white flex items-center justify-center shrink-0">
                <ArrowDown className="w-4 h-4" />
              </span>
              <h2 className="text-[17px] font-bold text-[#0F2E1F]">
                Pengeluaran
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('pengeluaran')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4E2DA] bg-[#F8FBF9] px-3 py-1.5 text-xs font-semibold text-[#234836] hover:bg-[#EAF3EE] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Lihat Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto py-2">
            <DonutChart slices={expenseSlices} total={totalExpense} size={172} />

            <div className="w-full sm:w-auto flex-1 max-w-[230px] space-y-3">
              {expenseSlices.map((slice) => {
                const pct =
                  totalExpense > 0 ? (slice.value / totalExpense) * 100 : 0;
                return (
                  <div
                    key={slice.label}
                    className="flex items-center justify-between gap-3 text-[13.5px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="font-medium text-[#243E31] truncate">
                        {slice.label}
                      </span>
                    </div>
                    <span className="font-semibold text-[#0F2E1F] tabular-nums shrink-0">
                      {formatPercent(pct)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* Row 3: Sumber Pemasukan + Rincian Pengeluaran */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Sumber Pemasukan Card */}
        <section className="xl:col-span-5 rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#0E6B43] text-white flex items-center justify-center shrink-0">
                <BarChart2 className="w-4 h-4" />
              </span>
              <h2 className="text-[17px] font-bold text-[#0F2E1F]">
                Sumber Pemasukan
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('sumber-pemasukan')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4E2DA] bg-[#F8FBF9] px-3 py-1.5 text-xs font-semibold text-[#234836] hover:bg-[#EAF3EE] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Lihat Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto py-2">
            <DonutChart
              slices={incomeSourceSlices}
              total={totalIncome}
              size={168}
            />

            <div className="w-full sm:w-auto flex-1 max-w-[220px] space-y-2.5">
              {incomeSourceSlices.map((slice) => {
                const pct =
                  totalIncome > 0 ? (slice.value / totalIncome) * 100 : 0;
                return (
                  <div
                    key={slice.label}
                    className="flex items-center justify-between gap-3 text-[13.5px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="font-medium text-[#243E31] truncate">
                        {slice.label}
                      </span>
                    </div>
                    <span className="font-semibold text-[#0F2E1F] tabular-nums shrink-0">
                      {formatPercent(pct)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Rincian Pengeluaran Card */}
        <section className="xl:col-span-7 rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#0E6B43] text-white flex items-center justify-center shrink-0">
                <List className="w-4 h-4" />
              </span>
              <h2 className="text-[17px] font-bold text-[#0F2E1F]">
                Rincian Pengeluaran
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('rincian-pengeluaran')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4E2DA] bg-[#F8FBF9] px-3 py-1.5 text-xs font-semibold text-[#234836] hover:bg-[#EAF3EE] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3ECE6] bg-[#F4F8F5] text-[12.5px] font-semibold text-[#2B4839]">
                  <th className="py-2.5 px-3 rounded-tl-lg">Tanggal</th>
                  <th className="py-2.5 px-3">Uraian</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right rounded-tr-lg">
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3EF] text-[13.5px]">
                {latestExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-sm text-[#5D7366]"
                    >
                      Belum ada catatan pengeluaran pada periode ini.
                    </td>
                  </tr>
                ) : (
                  latestExpenses.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => onNavigate('rincian-pengeluaran')}
                      className="hover:bg-[#F7FBF8] transition-colors cursor-pointer"
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Bottom Information Strip + Brand Badge */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-0.5">
        <div className="flex-1 flex items-center gap-3 rounded-2xl border border-[#DCE8E0] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(12,62,38,0.03)]">
          <span className="w-8 h-8 rounded-full bg-[#EAF3EE] text-[#0E6B43] flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4" />
          </span>
          <p className="text-[13.5px] text-[#2B4839] leading-snug">
            <strong className="font-bold text-[#0F2E1F]">Informasi :</strong>{' '}
            {settings.announcementText}
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#0C5034] to-[#083B25] px-5 py-3 text-white shadow-sm shrink-0">
          <FooterBadgeEmblem />
          <div className="leading-tight">
            <p className="text-[14.5px] font-bold tracking-tight">
              {settings.mosqueName}
            </p>
            <p className="text-[11.5px] text-emerald-100/85">
              {settings.tagline}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
