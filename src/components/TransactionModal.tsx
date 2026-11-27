import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_SOURCES } from '../data/initialData';
import {
  ExpenseCategory,
  IncomeSource,
  Transaction,
  TransactionType,
} from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id'>, editId?: string) => void;
  initialType?: TransactionType;
  initialCategory?: IncomeSource | ExpenseCategory;
  editingTransaction?: Transaction | null;
  defaultMonthKey?: string;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  initialType = 'pemasukan',
  initialCategory,
  editingTransaction,
  defaultMonthKey = '2026-11',
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>(initialType);
  const [date, setDate] = useState<string>(`${defaultMonthKey}-28`);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncomeSource | ExpenseCategory>(
    initialCategory ||
      (initialType === 'pemasukan' ? INCOME_SOURCES[0] : EXPENSE_CATEGORIES[0])
  );
  const [amount, setAmount] = useState<string>('');
  const [pic, setPic] = useState<string>('Bendahara');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      setCategory(editingTransaction.category);
      setAmount(String(editingTransaction.amount));
      setPic(editingTransaction.pic || '');
      setNotes(editingTransaction.notes || '');
    } else {
      setType(initialType);
      setDate(`${defaultMonthKey}-25`);
      setDescription('');
      setCategory(
        initialCategory ||
          (initialType === 'pemasukan'
            ? INCOME_SOURCES[0]
            : EXPENSE_CATEGORIES[0])
      );
      setAmount('');
      setPic(initialType === 'pemasukan' ? 'Takmir' : 'Bendahara');
      setNotes('');
    }
    setError('');
  }, [isOpen, editingTransaction, initialType, initialCategory, defaultMonthKey]);

  if (!isOpen) return null;

  const categories = type === 'pemasukan' ? INCOME_SOURCES : EXPENSE_CATEGORIES;

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setCategory(
      nextType === 'pemasukan' ? INCOME_SOURCES[0] : EXPENSE_CATEGORIES[0]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount.replace(/[^\d]/g, ''));
    if (!description.trim()) {
      setError('Uraian transaksi wajib diisi.');
      return;
    }
    if (!date) {
      setError('Tanggal transaksi wajib dipilih.');
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      setError('Nominal jumlah harus lebih dari Rp 0.');
      return;
    }

    onSave(
      {
        date,
        description: description.trim(),
        type,
        category,
        amount: numericAmount,
        pic: pic.trim() || 'Takmir',
        notes: notes.trim() || undefined,
      },
      editingTransaction?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-[#DCE8E0] bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E7EFEA] bg-[#F6FAF7] px-6 py-4">
          <h3 id="tx-modal-title" className="text-lg font-bold text-[#0F2E1F]">
            {editingTransaction ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#5D7366] hover:bg-[#E7EFEA] hover:text-[#0F2E1F] transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Segmented Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#4A6658] mb-1.5">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#EEF4F0] p-1">
              <button
                type="button"
                onClick={() => handleTypeChange('pemasukan')}
                className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                  type === 'pemasukan'
                    ? 'bg-[#0E6B43] text-white shadow-sm'
                    : 'text-[#4A6658] hover:text-[#0F2E1F]'
                }`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('pengeluaran')}
                className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                  type === 'pengeluaran'
                    ? 'bg-[#DC6B2F] text-white shadow-sm'
                    : 'text-[#4A6658] hover:text-[#0F2E1F]'
                }`}
              >
                Pengeluaran
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-semibold text-[#4A6658] mb-1.5"
              >
                Tanggal
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#D4E2DA] bg-white px-3.5 py-2.5 text-sm text-[#0F2E1F] focus:border-[#0E6B43] focus:outline-none focus:ring-2 focus:ring-[#0E6B43]/15"
                required
              />
            </div>

            <div>
              <label
                htmlFor="tx-category"
                className="block text-xs font-semibold text-[#4A6658] mb-1.5"
              >
                {type === 'pemasukan' ? 'Sumber Pemasukan' : 'Kategori Pengeluaran'}
              </label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as IncomeSource | ExpenseCategory)
                }
                className="w-full rounded-xl border border-[#D4E2DA] bg-white px-3.5 py-2.5 text-sm text-[#0F2E1F] focus:border-[#0E6B43] focus:outline-none focus:ring-2 focus:ring-[#0E6B43]/15"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="tx-desc"
              className="block text-xs font-semibold text-[#4A6658] mb-1.5"
            >
              Uraian / Keterangan
            </label>
            <input
              id="tx-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                type === 'pemasukan'
                  ? 'Contoh: Kotak Infak Sholat Jumat'
                  : 'Contoh: Konsumsi Kajian Rutin'
              }
              className="w-full rounded-xl border border-[#D4E2DA] bg-white px-3.5 py-2.5 text-sm text-[#0F2E1F] placeholder:text-[#94A89D] focus:border-[#0E6B43] focus:outline-none focus:ring-2 focus:ring-[#0E6B43]/15"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-semibold text-[#4A6658] mb-1.5"
              >
                Jumlah (Rp)
              </label>
              <input
                id="tx-amount"
                type="number"
                min={1}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000000"
                className="w-full rounded-xl border border-[#D4E2DA] bg-white px-3.5 py-2.5 text-sm font-mono tabular-nums text-[#0F2E1F] placeholder:text-[#94A89D] focus:border-[#0E6B43] focus:outline-none focus:ring-2 focus:ring-[#0E6B43]/15"
                required
              />
            </div>

            <div>
              <label
                htmlFor="tx-pic"
                className="block text-xs font-semibold text-[#4A6658] mb-1.5"
              >
                Penanggung Jawab
              </label>
              <input
                id="tx-pic"
                type="text"
                value={pic}
                onChange={(e) => setPic(e.target.value)}
                placeholder="Bendahara / Sie Sosial"
                className="w-full rounded-xl border border-[#D4E2DA] bg-white px-3.5 py-2.5 text-sm text-[#0F2E1F] placeholder:text-[#94A89D] focus:border-[#0E6B43] focus:outline-none focus:ring-2 focus:ring-[#0E6B43]/15"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="tx-notes"
              className="block text-xs font-semibold text-[#4A6658] mb-1.5"
            >
              Catatan Tambahan (Opsional)
            </label>
            <input
              id="tx-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nomor kwitansi atau keterangan bank"
              className="w-full rounded-xl border border-[#D4E2DA] bg-white px-3.5 py-2.5 text-sm text-[#0F2E1F] placeholder:text-[#94A89D] focus:border-[#0E6B43] focus:outline-none focus:ring-2 focus:ring-[#0E6B43]/15"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E7EFEA]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D4E2DA] bg-white px-4 py-2 text-sm font-semibold text-[#4A6658] hover:bg-[#F3F8F5] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#0E6B43] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0B5535] transition-colors shadow-sm"
            >
              {editingTransaction ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
