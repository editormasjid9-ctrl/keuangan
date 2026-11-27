import React, { useState } from 'react';
import { BarChart2, Plus } from 'lucide-react';
import { INCOME_SOURCES, INCOME_SOURCE_COLORS } from '../../data/initialData';
import { IncomeSource, Transaction, UserRole } from '../../types';
import {
  formatDateID,
  formatPercent,
  formatRupiah,
  getMonthKey,
} from '../../utils/formatters';
import { DonutChart } from '../Charts';

interface SumberPemasukanViewProps {
  transactions: Transaction[];
  selectedPeriod: string;
  userRole: UserRole;
  onAddIncomeForSource: (source: IncomeSource) => void;
}

const SOURCE_DESCRIPTIONS: Record<IncomeSource, string> = {
  'Kotak Infak':
    'Penerimaan kotak infak harian & Sholat Jumat di serambi masjid.',
  'Infak Online':
    'Transfer rekening BSI Masjid Asy-Syifa\' dan pemindaian QRIS jamaah.',
  'Sewa Hall':
    'Kontribusi pemanfaatan aula & ruang kajian oleh unit atau komunitas.',
  Donatur:
    'Komitmen donasi rutin dokter, perawat, karyawan RSML, dan dermawan.',
};

export function SumberPemasukanView({
  transactions,
  selectedPeriod,
  userRole,
  onAddIncomeForSource,
}: SumberPemasukanViewProps) {
  const [activeSource, setActiveSource] = useState<IncomeSource>('Kotak Infak');
  const canModify = userRole !== 'Jamaah';

  const incomeTransactions = transactions
    .filter((t) => t.type === 'pemasukan')
    .filter((t) =>
      selectedPeriod === 'all' ? true : getMonthKey(t.date) === selectedPeriod
    );

  const totalIncome = incomeTransactions.reduce((s, t) => s + t.amount, 0);

  const sourceStats = INCOME_SOURCES.map((src) => {
    const items = incomeTransactions.filter((t) => t.category === src);
    const sum = items.reduce((s, t) => s + t.amount, 0);
    const pct = totalIncome > 0 ? (sum / totalIncome) * 100 : 0;
    return {
      source: src,
      sum,
      pct,
      count: items.length,
      color: INCOME_SOURCE_COLORS[src],
    };
  });

  const activeItems = incomeTransactions
    .filter((t) => t.category === activeSource)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      {/* 4 Source Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {sourceStats.map((item) => {
          const isSelected = activeSource === item.source;
          return (
            <div
              key={item.source}
              onClick={() => setActiveSource(item.source)}
              className={`rounded-2xl border p-5 transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#0E6B43] bg-white ring-2 ring-[#0E6B43]/15 shadow-sm'
                  : 'border-[#DCE8E0] bg-white hover:border-[#A7C7B5]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-bold text-[#0F2E1F]">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.source}
                </span>
                <span className="text-xs font-bold text-[#0E6B43] tabular-nums">
                  {formatPercent(item.pct)}
                </span>
              </div>

              <p className="mt-2.5 text-xl font-bold text-[#0F2E1F] tabular-nums">
                {formatRupiah(item.sum)}
              </p>
              <p className="mt-1 text-xs text-[#5D7366] leading-relaxed">
                {SOURCE_DESCRIPTIONS[item.source]}
              </p>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#EEF3EF]">
                <span className="text-xs text-[#5D7366]">
                  {item.count} transaksi
                </span>
                {canModify && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddIncomeForSource(item.source);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#EAF3EE] px-2.5 py-1 text-xs font-semibold text-[#0E6B43] hover:bg-[#D5E9DD]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribution Donut + Selected Source Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)]">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="w-8 h-8 rounded-full bg-[#0E6B43] text-white flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </span>
            <h2 className="text-[17px] font-bold text-[#0F2E1F]">
              Distribusi Sumber Dana
            </h2>
          </div>

          <div className="flex flex-col items-center gap-5 py-2">
            <DonutChart
              slices={sourceStats.map((s) => ({
                label: s.source,
                value: s.sum,
                color: s.color,
              }))}
              total={totalIncome}
              size={188}
            />
            <div className="w-full space-y-2.5 border-t border-[#EEF3EF] pt-4">
              {sourceStats.map((s) => (
                <div
                  key={s.source}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 font-medium text-[#243E31]">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.source}
                  </span>
                  <span className="font-semibold text-[#0F2E1F] tabular-nums">
                    {formatRupiah(s.sum)} ({formatPercent(s.pct)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[17px] font-bold text-[#0F2E1F]">
                Riwayat Sumber: {activeSource}
              </h2>
              <p className="text-xs text-[#5D7366]">
                Klik kartu sumber di atas untuk mengganti rincian sumber dana.
              </p>
            </div>
            {canModify && (
              <button
                type="button"
                onClick={() => onAddIncomeForSource(activeSource)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E6B43] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0B5535] whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Catat {activeSource}
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3ECE6] bg-[#F4F8F5] text-xs font-semibold text-[#2B4839]">
                  <th className="py-2.5 px-3 rounded-tl-lg">Tanggal</th>
                  <th className="py-2.5 px-3">Uraian</th>
                  <th className="py-2.5 px-3">Penanggung Jawab</th>
                  <th className="py-2.5 px-3 text-right rounded-tr-lg">
                    Jumlah
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3EF] text-sm">
                {activeItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-[#5D7366]"
                    >
                      Belum ada pemasukan untuk {activeSource} pada periode ini.
                    </td>
                  </tr>
                ) : (
                  activeItems.map((row) => (
                    <tr key={row.id} className="hover:bg-[#F7FBF8]">
                      <td className="py-2.5 px-3 text-[#3D5549] tabular-nums whitespace-nowrap">
                        {formatDateID(row.date)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#0F2E1F]">
                        {row.description}
                      </td>
                      <td className="py-2.5 px-3 text-[#5D7366] whitespace-nowrap">
                        {row.pic || '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#0E6B43] tabular-nums whitespace-nowrap">
                        {formatRupiah(row.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
