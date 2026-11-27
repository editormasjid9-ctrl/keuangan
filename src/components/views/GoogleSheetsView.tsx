import React, { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FolderOpen,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import {
  createMosqueSpreadsheet,
  DriveSpreadsheetFile,
  extractSpreadsheetId,
  getSpreadsheetMetadata,
  listSpreadsheets,
  parseRowsToTransactions,
  readRawSheetValues,
  SpreadsheetMetadata,
  WorkspaceAuthError,
  writeTransactionsToSheet,
} from '../../services/googleSheets';
import { MosqueSettings, Transaction, UserRole } from '../../types';
import { formatDateID, formatRupiah } from '../../utils/formatters';
import { GoogleSignInButton } from '../GoogleSignInButton';

interface GoogleSheetsViewProps {
  googleUser: User | null;
  accessToken: string | null;
  needsAuth: boolean;
  isLoggingIn: boolean;
  onGoogleLogin: () => Promise<void>;
  onGoogleLogout: () => Promise<void>;
  onAuthExpired: () => void;
  transactions: Transaction[];
  onImportTransactions: (
    imported: Transaction[],
    mode: 'replace' | 'merge'
  ) => void;
  settings: MosqueSettings;
  userRole: UserRole;
  onShowToast: (msg: string) => void;
}

interface PendingConfirmAction {
  kind: 'write-sheet' | 'import-replace' | 'import-merge';
  title: string;
  description: string;
  confirmLabel: string;
}

function isSafeHttpsUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function GoogleSheetsView({
  googleUser,
  accessToken,
  needsAuth,
  isLoggingIn,
  onGoogleLogin,
  onGoogleLogout,
  onAuthExpired,
  transactions,
  onImportTransactions,
  settings,
  userRole,
  onShowToast,
}: GoogleSheetsViewProps) {
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [manualIdInput, setManualIdInput] = useState('');

  const [selectedMetadata, setSelectedMetadata] =
    useState<SpreadsheetMetadata | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>('');
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [parsedPreview, setParsedPreview] = useState<Transaction[]>([]);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newSheetTitle, setNewSheetTitle] = useState(
    `Laporan Keuangan ${settings.mosqueName} 2026`
  );
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [pendingConfirm, setPendingConfirm] =
    useState<PendingConfirmAction | null>(null);

  const isReadOnlyRole = userRole === 'Jamaah';

  const handleApiError = (err: unknown) => {
    if (err instanceof WorkspaceAuthError) {
      onAuthExpired();
      setErrorMsg(err.message);
      return;
    }
    const msg =
      err instanceof Error ? err.message : 'Terjadi kesalahan saat menghubungi Google Sheets.';
    setErrorMsg(msg);
  };

  const fetchDriveSpreadsheets = async (token: string) => {
    setLoadingFiles(true);
    setErrorMsg(null);
    try {
      const files = await listSpreadsheets(token);
      setDriveFiles(files);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (accessToken && !needsAuth) {
      fetchDriveSpreadsheets(accessToken);
    }
  }, [accessToken, needsAuth]);

  const loadSpreadsheet = async (spreadsheetId: string) => {
    if (!accessToken) {
      onAuthExpired();
      return;
    }
    const cleanId = extractSpreadsheetId(spreadsheetId);
    if (!cleanId) {
      setErrorMsg('Masukkan ID atau tautan Google Spreadsheet yang valid.');
      return;
    }
    setLoadingSheet(true);
    setErrorMsg(null);
    try {
      const meta = await getSpreadsheetMetadata(accessToken, cleanId);
      setSelectedMetadata(meta);
      const firstTab = meta.sheets[0]?.title || '';
      setSelectedTab(firstTab);
      if (firstTab) {
        const rows = await readRawSheetValues(accessToken, meta.spreadsheetId, firstTab);
        setRawRows(rows);
        setParsedPreview(parseRowsToTransactions(rows));
      } else {
        setRawRows([]);
        setParsedPreview([]);
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoadingSheet(false);
    }
  };

  const loadTabData = async (tabTitle: string) => {
    if (!accessToken || !selectedMetadata) return;
    setSelectedTab(tabTitle);
    setLoadingSheet(true);
    setErrorMsg(null);
    try {
      const rows = await readRawSheetValues(
        accessToken,
        selectedMetadata.spreadsheetId,
        tabTitle
      );
      setRawRows(rows);
      setParsedPreview(parseRowsToTransactions(rows));
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleCreateNewSpreadsheet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      onAuthExpired();
      return;
    }
    const title = newSheetTitle.trim();
    if (!title) {
      setErrorMsg('Nama spreadsheet baru wajib diisi.');
      return;
    }
    setCreatingSheet(true);
    setErrorMsg(null);
    try {
      const created = await createMosqueSpreadsheet(
        accessToken,
        title,
        transactions
      );
      setSelectedMetadata(created);
      const firstTab = created.sheets[0]?.title || 'Transaksi Kas';
      setSelectedTab(firstTab);
      const rows = await readRawSheetValues(
        accessToken,
        created.spreadsheetId,
        firstTab
      );
      setRawRows(rows);
      setParsedPreview(parseRowsToTransactions(rows));
      await fetchDriveSpreadsheets(accessToken);
      onShowToast(`Spreadsheet "${created.title}" berhasil dibuat dan diisi data.`);
    } catch (err) {
      handleApiError(err);
    } finally {
      setCreatingSheet(false);
    }
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    const action = pendingConfirm;
    setPendingConfirm(null);

    if (action.kind === 'write-sheet') {
      if (!accessToken || !selectedMetadata || !selectedTab) {
        onAuthExpired();
        return;
      }
      setSyncing(true);
      setErrorMsg(null);
      try {
        await writeTransactionsToSheet(
          accessToken,
          selectedMetadata.spreadsheetId,
          selectedTab,
          transactions
        );
        const rows = await readRawSheetValues(
          accessToken,
          selectedMetadata.spreadsheetId,
          selectedTab
        );
        setRawRows(rows);
        setParsedPreview(parseRowsToTransactions(rows));
        onShowToast(
          `${transactions.length} transaksi berhasil disinkronkan ke tab "${selectedTab}".`
        );
      } catch (err) {
        handleApiError(err);
      } finally {
        setSyncing(false);
      }
      return;
    }

    if (action.kind === 'import-replace') {
      onImportTransactions(parsedPreview, 'replace');
      onShowToast(
        `${parsedPreview.length} transaksi dari Google Sheets menggantikan data dashboard.`
      );
      return;
    }

    if (action.kind === 'import-merge') {
      onImportTransactions(parsedPreview, 'merge');
      onShowToast(
        `${parsedPreview.length} transaksi dari Google Sheets digabungkan ke dashboard.`
      );
    }
  };

  const filteredFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(fileSearch.trim().toLowerCase())
  );

  // Unauthenticated / Token Unavailable State
  if (needsAuth || !accessToken) {
    return (
      <div className="rounded-2xl border border-[#DCE8E0] bg-white p-8 shadow-[0_2px_10px_rgba(12,62,38,0.04)] max-w-2xl mx-auto text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#EAF3EE] text-[#0E6B43] flex items-center justify-center mx-auto">
          <FileSpreadsheet className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#0F2E1F]">
            Hubungkan Google Sheets & Google Drive
          </h2>
          <p className="text-sm text-[#4A6658] leading-relaxed">
            Masuk dengan akun Google Anda untuk membaca data dari Google Sheets, membuat buku kas masjid baru di Google Drive, dan menyinkronkan catatan pemasukan maupun pengeluaran secara langsung.
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 text-left">
            {errorMsg}
          </div>
        )}

        <div className="flex justify-center pt-1">
          <GoogleSignInButton
            onClick={onGoogleLogin}
            disabled={isLoggingIn}
            label={isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}
          />
        </div>

        <p className="text-xs text-[#6B8477]">
          Akses hanya disimpan sementara di memori sesi browser dan dapat diputuskan kapan saja.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connected Account Banner */}
      <div className="rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#EAF3EE] text-[#0E6B43] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#0F2E1F] truncate">
              Terhubung sebagai {googleUser?.displayName || 'Pengguna Google'}
            </p>
            <p className="text-xs text-[#5D7366] truncate">
              {googleUser?.email || 'Akun Google Workspace aktif'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fetchDriveSpreadsheets(accessToken)}
            disabled={loadingFiles}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4E2DA] bg-white px-3.5 py-2 text-xs font-semibold text-[#234836] hover:bg-[#F3F8F5] transition-colors whitespace-nowrap"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loadingFiles ? 'animate-spin' : ''}`}
            />
            <span>Muat Ulang Drive</span>
          </button>
          <button
            type="button"
            onClick={onGoogleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4E2DA] bg-white px-3.5 py-2 text-xs font-semibold text-[#D95D41] hover:bg-orange-50 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Putuskan Akun</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-red-500 hover:text-red-700"
            aria-label="Tutup pesan galat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isReadOnlyRole && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          Mode akses saat ini adalah <strong>Jamaah (Hanya Baca)</strong>. Anda tetap dapat membaca pratinjau Google Sheets, tetapi ubah peran ke <strong>Takmir</strong> atau <strong>Bendahara</strong> di kanan atas untuk menulis ke Google Sheets atau mengubah data dashboard.
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left Column: Create or Pick Spreadsheet from Google Drive */}
        <div className="xl:col-span-5 space-y-4">
          {/* Create New Spreadsheet Card */}
          <form
            onSubmit={handleCreateNewSpreadsheet}
            className="rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] space-y-3"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-[#0E6B43] text-white flex items-center justify-center shrink-0">
                <Plus className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-[15px] font-bold text-[#0F2E1F]">
                  Buat Spreadsheet Kas Baru
                </h3>
                <p className="text-xs text-[#5D7366]">
                  Ekspor {transactions.length} transaksi dashboard ke file baru di Google Drive.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newSheetTitle}
                onChange={(e) => setNewSheetTitle(e.target.value)}
                placeholder="Nama spreadsheet baru..."
                disabled={isReadOnlyRole || creatingSheet}
                className="flex-1 rounded-xl border border-[#D4E2DA] bg-[#F8FBF9] px-3.5 py-2 text-sm text-[#0F2E1F] focus:bg-white focus:border-[#0E6B43] focus:outline-none disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isReadOnlyRole || creatingSheet}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0E6B43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B5535] transition-colors whitespace-nowrap disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{creatingSheet ? 'Membuat...' : 'Buat Sheet'}</span>
              </button>
            </div>
          </form>

          {/* Open by URL / ID */}
          <div className="rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] space-y-3">
            <h3 className="text-[15px] font-bold text-[#0F2E1F]">
              Buka dengan URL atau ID Spreadsheet
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualIdInput}
                onChange={(e) => setManualIdInput(e.target.value)}
                placeholder="Tempel tautan docs.google.com/spreadsheets/d/..."
                className="flex-1 rounded-xl border border-[#D4E2DA] bg-[#F8FBF9] px-3.5 py-2 text-sm text-[#0F2E1F] focus:bg-white focus:border-[#0E6B43] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => loadSpreadsheet(manualIdInput)}
                disabled={!manualIdInput.trim() || loadingSheet}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4E2DA] bg-white px-4 py-2 text-sm font-semibold text-[#234836] hover:bg-[#F3F8F5] disabled:opacity-50 whitespace-nowrap"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Buka</span>
              </button>
            </div>
          </div>

          {/* Drive Spreadsheets List */}
          <div className="rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-bold text-[#0F2E1F]">
                Spreadsheet di Google Drive
              </h3>
              <span className="text-xs font-medium text-[#5D7366] tabular-nums">
                {filteredFiles.length} file
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-[#6B8477] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                placeholder="Cari nama file spreadsheet..."
                className="w-full rounded-xl border border-[#D4E2DA] bg-[#F8FBF9] pl-9 pr-3 py-2 text-sm text-[#0F2E1F] focus:bg-white focus:border-[#0E6B43] focus:outline-none"
              />
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-[#EEF3EF] border border-[#E7EFEA] rounded-xl">
              {loadingFiles ? (
                <div className="p-6 text-center text-xs text-[#5D7366]">
                  Memuat daftar spreadsheet dari Google Drive...
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#5D7366]">
                  Tidak ada file Google Sheets ditemukan di Drive Anda.
                </div>
              ) : (
                filteredFiles.map((file) => {
                  const isActive =
                    selectedMetadata?.spreadsheetId === file.id;
                  return (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => loadSpreadsheet(file.id)}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors ${
                        isActive
                          ? 'bg-[#EAF3EE] text-[#0E6B43]'
                          : 'hover:bg-[#F7FBF8] text-[#0F2E1F]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileSpreadsheet className="w-4 h-4 text-[#168C55] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {file.name}
                          </p>
                          {file.modifiedTime && (
                            <p className="text-[11px] text-[#6B8477] tabular-nums">
                              Diubah:{' '}
                              {new Date(file.modifiedTime).toLocaleDateString(
                                'id-ID'
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-[#0E6B43] shrink-0">
                        {isActive ? 'Aktif' : 'Pilih'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Spreadsheet Preview & Sync */}
        <div className="xl:col-span-7 rounded-2xl border border-[#DCE8E0] bg-white p-5 shadow-[0_2px_10px_rgba(12,62,38,0.04)] flex flex-col justify-between space-y-4">
          {!selectedMetadata ? (
            <div className="my-auto py-16 text-center space-y-2">
              <FileSpreadsheet className="w-10 h-10 text-[#9CB3A6] mx-auto" />
              <p className="text-sm font-semibold text-[#2B4839]">
                Pilih salah satu spreadsheet di sebelah kiri atau buat spreadsheet baru
              </p>
              <p className="text-xs text-[#5D7366] max-w-md mx-auto">
                Setelah spreadsheet dipilih, Anda dapat memilih tab sheet, melihat isi tabel, mengimpor data ke dashboard, atau menyinkronkan data dashboard ke Google Sheets.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EEF3EF]">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-[#0F2E1F] truncate">
                      {selectedMetadata.title}
                    </h3>
                    <p className="text-xs text-[#5D7366] tabular-nums">
                      {selectedMetadata.sheets.length} tab sheet tersedia ·{' '}
                      {parsedPreview.length} transaksi terbaca pada tab ini
                    </p>
                  </div>

                  {isSafeHttpsUrl(selectedMetadata.spreadsheetUrl) && (
                    <a
                      href={selectedMetadata.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4E2DA] bg-[#F8FBF9] px-3 py-1.5 text-xs font-semibold text-[#234836] hover:bg-[#EAF3EE] whitespace-nowrap shrink-0"
                    >
                      <span>Buka di Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Dynamic Sheet Tab Selector */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#EEF4F0] p-1">
                    {selectedMetadata.sheets.map((tab) => (
                      <button
                        key={tab.sheetId}
                        type="button"
                        onClick={() => loadTabData(tab.title)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                          selectedTab === tab.title
                            ? 'bg-white text-[#0F2E1F] shadow-xs'
                            : 'text-[#4A6658] hover:text-[#0F2E1F]'
                        }`}
                      >
                        {tab.title}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => loadTabData(selectedTab)}
                    disabled={loadingSheet}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D4E2DA] px-3 py-1.5 text-xs font-semibold text-[#234836] hover:bg-[#F3F8F5]"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        loadingSheet ? 'animate-spin' : ''
                      }`}
                    />
                    <span>Segarkan Tab</span>
                  </button>
                </div>

                {/* Preview Table */}
                <div className="overflow-x-auto border border-[#E7EFEA] rounded-xl max-h-80">
                  {loadingSheet ? (
                    <div className="py-12 text-center text-xs text-[#5D7366]">
                      Membaca data tab "{selectedTab}"...
                    </div>
                  ) : rawRows.length === 0 ? (
                    <div className="py-12 text-center text-xs text-[#5D7366]">
                      Tab "{selectedTab}" masih kosong. Anda dapat menyinkronkan {transactions.length} transaksi dashboard ke tab ini.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-[#F4F8F5] border-b border-[#E3ECE6] text-[#2B4839] font-semibold">
                        <tr>
                          {(rawRows[0] || []).map((cell, idx) => (
                            <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                              {cell || `Kolom ${idx + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEF3EF]">
                        {rawRows.slice(1, 31).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#F7FBF8]">
                            {(rawRows[0] || []).map((_, cIdx) => (
                              <td
                                key={cIdx}
                                className="py-2 px-3 text-[#2B4839] whitespace-nowrap tabular-nums"
                              >
                                {row[cIdx] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {parsedPreview.length > 0 && (
                  <div className="rounded-xl bg-[#F4F9F6] border border-[#DCE8E0] px-4 py-2.5 text-xs text-[#2B4839] flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Terdeteksi <strong>{parsedPreview.length}</strong> baris transaksi valid (contoh terakhir:{' '}
                      <strong>{parsedPreview[0].description}</strong> —{' '}
                      <span className="tabular-nums">
                        {formatDateID(parsedPreview[0].date)},{' '}
                        {formatRupiah(parsedPreview[0].amount)}
                      </span>
                      )
                    </span>
                  </div>
                )}
              </div>

              {/* Sync & Import Action Bar */}
              <div className="pt-4 border-t border-[#EEF3EF] flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isReadOnlyRole || parsedPreview.length === 0}
                    onClick={() =>
                      setPendingConfirm({
                        kind: 'import-merge',
                        title: 'Gabungkan Data dari Google Sheets?',
                        description: `Sebanyak ${parsedPreview.length} transaksi dari tab "${selectedTab}" pada "${selectedMetadata.title}" akan ditambahkan ke daftar transaksi dashboard saat ini.`,
                        confirmLabel: 'Ya, Gabungkan Data',
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4E2DA] bg-white px-3.5 py-2 text-xs font-semibold text-[#234836] hover:bg-[#F3F8F5] disabled:opacity-50 whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Impor (Gabungkan)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isReadOnlyRole || parsedPreview.length === 0}
                    onClick={() =>
                      setPendingConfirm({
                        kind: 'import-replace',
                        title: 'Ganti Data Dashboard dengan Google Sheets?',
                        description: `Seluruh ${transactions.length} transaksi lokal di dashboard saat ini akan diganti dengan ${parsedPreview.length} transaksi dari tab "${selectedTab}" (${selectedMetadata.title}).`,
                        confirmLabel: 'Ya, Ganti Data Dashboard',
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4E2DA] bg-white px-3.5 py-2 text-xs font-semibold text-[#D95D41] hover:bg-orange-50 disabled:opacity-50 whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Impor (Ganti Semua)</span>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isReadOnlyRole || syncing || !selectedTab}
                  onClick={() =>
                    setPendingConfirm({
                      kind: 'write-sheet',
                      title: `Perbarui Isi Tab "${selectedTab}" di Google Sheets?`,
                      description: `Operasi ini akan menimpa seluruh isi kolom A–H pada tab "${selectedTab}" di spreadsheet "${selectedMetadata.title}" dengan ${transactions.length} transaksi terbaru dari dashboard.`,
                      confirmLabel: 'Ya, Sinkronkan ke Sheets',
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E6B43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B5535] disabled:opacity-50 shadow-xs whitespace-nowrap"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {syncing
                      ? 'Menyinkronkan...'
                      : 'Simpan ke Google Sheets'}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mandatory Confirmation Modal for Mutating / Overwrite Operations */}
      {pendingConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gs-confirm-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#DCE8E0] bg-white shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 border-b border-[#E7EFEA] bg-[#FFF8F3] px-6 py-4">
              <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <h3
                id="gs-confirm-title"
                className="text-base font-bold text-[#0F2E1F]"
              >
                {pendingConfirm.title}
              </h3>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-[#3D5549] leading-relaxed">
                {pendingConfirm.description}
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EEF3EF]">
                <button
                  type="button"
                  onClick={() => setPendingConfirm(null)}
                  className="rounded-xl border border-[#D4E2DA] bg-white px-4 py-2 text-sm font-semibold text-[#4A6658] hover:bg-[#F3F8F5]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={executeConfirmedAction}
                  className="rounded-xl bg-[#0E6B43] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B5535]"
                >
                  {pendingConfirm.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
