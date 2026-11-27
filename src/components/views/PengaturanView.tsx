import React, { useState } from 'react';
import { RotateCcw, Save, Settings } from 'lucide-react';
import { MonthlyTarget, MosqueSettings, UserRole } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface PengaturanViewProps {
  settings: MosqueSettings;
  monthlyTargets: MonthlyTarget[];
  userRole: UserRole;
  onSaveSettings: (next: MosqueSettings) => void;
  onUpdateTarget: (monthKey: string, nextAmount: number) => void;
  onResetAllData: () => void;
}

export function PengaturanView({
  settings,
  monthlyTargets,
  userRole,
  onSaveSettings,
  onUpdateTarget,
  onResetAllData,
}: PengaturanViewProps) {
  const [form, setForm] = useState<MosqueSettings>(settings);
  const [targetEdits, setTargetEdits] = useState<Record<string, string>>(
    Object.fromEntries(
      monthlyTargets.map((m) => [m.monthKey, String(m.targetAmount)])
    )
  );
  const [confirmReset, setConfirmReset] = useState(false);

  const isReadOnly = userRole === 'Jamaah';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    monthlyTargets.forEach((m) => {
      const val = Number(targetEdits[m.monthKey] || m.targetAmount);
      if (!Number.isNaN(val) && val > 0 && val !== m.targetAmount) {
        onUpdateTarget(m.monthKey, val);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isReadOnly && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Anda sedang masuk dengan tampilan <strong>Jamaah (Hanya Baca)</strong>. Ubah peran ke <strong>Takmir</strong> atau <strong>Bendahara</strong> di pojok kanan atas untuk menyimpan perubahan pengaturan.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Mosque Profile & Announcement */}
        <div className="lg:col-span-7 rounded-2xl border border-[#DCE8E0] bg-white p-6 shadow-[0_2px_10px_rgba(12,62,38,0.04)] space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#EEF3EF]">
            <span className="w-8 h-8 rounded-full bg-[#0E6B43] text-white flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </span>
            <h2 className="text-[17px] font-bold text-[#0F2E1F]">
              Profil Masjid & Teks Informasi
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A6658] mb-1.5">
                Nama Masjid
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={form.mosqueName}
                onChange={(e) =>
                  setForm({ ...form, mosqueName: e.target.value })
                }
                className="w-full rounded-xl border border-[#D4E2DA] px-3.5 py-2.5 text-sm text-[#0F2E1F] disabled:bg-[#F5F8F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A6658] mb-1.5">
                Instansi / Lokasi
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={form.institutionName}
                onChange={(e) =>
                  setForm({ ...form, institutionName: e.target.value })
                }
                className="w-full rounded-xl border border-[#D4E2DA] px-3.5 py-2.5 text-sm text-[#0F2E1F] disabled:bg-[#F5F8F6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A6658] mb-1.5">
                Ketua Takmir
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={form.takmirLead}
                onChange={(e) =>
                  setForm({ ...form, takmirLead: e.target.value })
                }
                className="w-full rounded-xl border border-[#D4E2DA] px-3.5 py-2.5 text-sm text-[#0F2E1F] disabled:bg-[#F5F8F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A6658] mb-1.5">
                Bendahara Masjid
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={form.treasurerName}
                onChange={(e) =>
                  setForm({ ...form, treasurerName: e.target.value })
                }
                className="w-full rounded-xl border border-[#D4E2DA] px-3.5 py-2.5 text-sm text-[#0F2E1F] disabled:bg-[#F5F8F6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4A6658] mb-1.5">
                Motto Sidebar
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={form.motto}
                onChange={(e) => setForm({ ...form, motto: e.target.value })}
                className="w-full rounded-xl border border-[#D4E2DA] px-3.5 py-2.5 text-sm text-[#0F2E1F] disabled:bg-[#F5F8F6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A6658] mb-1.5">
                Tagline Lencana Bawah
              </label>
              <input
                type="text"
                disabled={isReadOnly}
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full rounded-xl border border-[#D4E2DA] px-3.5 py-2.5 text-sm text-[#0F2E1F] disabled:bg-[#F5F8F6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4A6658] mb-1.5">
              Teks Informasi Jamaah (Footer Dashboard)
            </label>
            <textarea
              rows={2}
              disabled={isReadOnly}
              value={form.announcementText}
              onChange={(e) =>
                setForm({ ...form, announcementText: e.target.value })
              }
              className="w-full rounded-xl border border-[#D4E2DA] px-3.5 py-2.5 text-sm text-[#0F2E1F] disabled:bg-[#F5F8F6]"
            />
          </div>
        </div>

        {/* Monthly Target Configuration */}
        <div className="lg:col-span-5 rounded-2xl border border-[#DCE8E0] bg-white p-6 shadow-[0_2px_10px_rgba(12,62,38,0.04)] flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-[17px] font-bold text-[#0F2E1F] pb-3 border-b border-[#EEF3EF]">
              Target Pemasukan Bulanan
            </h2>
            <div className="mt-4 space-y-3">
              {monthlyTargets.map((m) => (
                <div
                  key={m.monthKey}
                  className="flex items-center justify-between gap-3"
                >
                  <label
                    htmlFor={`target-${m.monthKey}`}
                    className="text-sm font-medium text-[#2B4839]"
                  >
                    {m.fullLabel}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`target-${m.monthKey}`}
                      type="number"
                      min={100000}
                      step={100000}
                      disabled={isReadOnly}
                      value={targetEdits[m.monthKey] || ''}
                      onChange={(e) =>
                        setTargetEdits({
                          ...targetEdits,
                          [m.monthKey]: e.target.value,
                        })
                      }
                      className="w-36 rounded-xl border border-[#D4E2DA] px-3 py-2 text-right text-sm font-mono tabular-nums text-[#0F2E1F] disabled:bg-[#F5F8F6]"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#5D7366]">
              Target November 2026 saat ini:{' '}
              <strong className="text-[#0F2E1F]">
                {formatRupiah(
                  Number(targetEdits['2026-11'] || 10_000_000)
                )}
              </strong>
            </p>
          </div>

          {!isReadOnly && (
            <div className="pt-4 border-t border-[#EEF3EF] flex flex-wrap items-center justify-between gap-3">
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4E2DA] px-3.5 py-2 text-xs font-semibold text-[#4A6658] hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data Awal</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetAllData();
                      setConfirmReset(false);
                    }}
                    className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Ya, Reset Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-xl border border-[#D4E2DA] px-3 py-1.5 text-xs font-semibold text-[#4A6658]"
                  >
                    Batal
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-[#0E6B43] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0B5535] transition-colors shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
