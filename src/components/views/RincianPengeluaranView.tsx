import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Download,
  Edit2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_COLORS,
} from '../../data/initialData';
import { Transaction, UserRole } from '../../types';
import {
  exportTransactionsToCSV,
  formatDateID,
  formatRupiah,
  getMonthKey,
} from '../../utils/formatters';

interface RincianPengeluaranViewProps {
  transactions: Transaction[];
  selectedPeriod: string;
  userRole: UserRole;
  onAddExpense: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export function RincianPengeluaranView({
  transactions,
  selectedPeriod,
  userRole,
  onAddExpense,
  onEditTransaction,
  onDeleteTransaction,
}: RincianPengeluaranViewProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  const canModify = userRole !== 'Jamaah';

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'pengeluaran')
      .filter((t) =>
        selectedPeriod === 'all' ? true : getMonthKey(t.date) === selectedPeriod
      )
      .filter((t) =>
        categoryFilter === 'all' ? true : t.category === categoryFilter
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
      .sort((a, b) => {
        if (sortBy === 'date') {
          return sortDir === 'desc'
            ? b.date.localeCompare(a.date)
            : a.date.localeCompare(b.date);
        }
        return sortDir === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      });
  }, [transactions, selectedPeriod, categoryFilter, search, sortBy, sortDir]);

  const totalFiltered = filtered.reduce((s, t) => s + t.amount, 0);

  const toggleSort = (col: 'date' | 'amount') => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  return (
    <div className="rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-bold text-[#0F2E1F]">
            Buku Rincian Pengeluaran
          </h2>
          <p className="text-xs text-[#5D7366]">
            Seluruh pos pengeluaran operasional, kegiatan masjid, dan sosial dakwah.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canModify && (
            <button
              type="button"
              onClick={onAddExpense}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E6B43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B5535] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Pengeluaran</span>
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              exportTransactionsToCSV(
                filtered,
                `rincian-pengeluaran-${selectedPeriod}.csv`
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4E2DA] bg-white px-4 py-2 text-sm font-semibold text-[#234836] hover:bg-[#F3F8F5] transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#EEF4F0] p-1">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-white text-[#0F2E1F] shadow-xs'
                : 'text-[#4A6658] hover:text-[#0F2E1F]'
            }`}
          >
            Semua Kategori
          </button>
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-white text-[#0F2E1F] shadow-xs'
                  : 'text-[#4A6658] hover:text-[#0F2E1F]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#6B8477] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari uraian, kategori, atau PIC..."
            className="w-full rounded-xl border border-[#D4E2DA] bg-[#F8FBF9] pl-9 pr-3 py-2 text-sm text-[#0F2E1F] placeholder:text-[#869B8F] focus:bg-white focus:border-[#0E6B43] focus:outline-none"
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E3ECE6] bg-[#F4F8F5] text-xs font-semibold text-[#2B4839]">
              <th className="py-3 px-3 rounded-tl-lg">
                <button
                  type="button"
                  onClick={() => toggleSort('date')}
                  className="inline-flex items-center gap-1 hover:text-[#0F2E1F]"
                >
                  <span>Tanggal</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              <th className="py-3 px-3">Uraian</th>
              <th className="py-3 px-3">Kategori</th>
              <th className="py-3 px-3">Penanggung Jawab</th>
              <th className="py-3 px-3 text-right">
                <button
                  type="button"
                  onClick={() => toggleSort('amount')}
                  className="inline-flex items-center gap-1 hover:text-[#0F2E1F]"
                >
                  <span>Jumlah</span>
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </th>
              {canModify && (
                <th className="py-3 px-3 text-right rounded-tr-lg">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEF3EF] text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={canModify ? 6 : 5}
                  className="py-10 text-center text-[#5D7366]"
                >
                  <p className="font-medium">
                    Tidak ditemukan catatan pengeluaran.
                  </p>
                  {canModify && (
                    <button
                      type="button"
                      onClick={onAddExpense}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#0E6B43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5535]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah Pengeluaran
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#F7FBF8] transition-colors"
                >
                  <td className="py-3 px-3 text-[#3D5549] tabular-nums whitespace-nowrap">
                    {formatDateID(row.date)}
                  </td>
                  <td className="py-3 px-3 font-medium text-[#0F2E1F]">
                    <div>{row.description}</div>
                    {row.notes && (
                      <div className="text-xs text-[#6B8477] mt-0.5">
                        {row.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-[#3D5549] whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            EXPENSE_CATEGORY_COLORS[
                              row.category as keyof typeof EXPENSE_CATEGORY_COLORS
                            ] || '#64748B',
                        }}
                      />
                      {row.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#5D7366] whitespace-nowrap">
                    {row.pic || '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-[#0F2E1F] tabular-nums whitespace-nowrap">
                    {formatRupiah(row.amount)}
                  </td>
                  {canModify && (
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditTransaction(row)}
                          className="rounded-lg p-1.5 text-[#4A6658] hover:bg-[#E7EFEA] hover:text-[#0F2E1F]"
                          title="Edit pengeluaran"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(row.id)}
                          className="rounded-lg p-1.5 text-[#4A6658] hover:bg-red-50 hover:text-red-600"
                          title="Hapus pengeluaran"
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
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-[#DCE8E0] bg-[#F6FAF7] text-sm font-bold text-[#0F2E1F]">
                <td colSpan={4} className="py-3 px-3">
                  Total Pengeluaran Terfilter ({filtered.length} item)
                </td>
                <td className="py-3 px-3 text-right tabular-nums">
                  {formatRupiah(totalFiltered)}
                </td>
                {canModify && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
