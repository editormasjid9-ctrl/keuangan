import React, { useEffect, useRef, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  Maximize2,
  Menu,
  Minimize2,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  User,
} from 'lucide-react';
import { HeaderMosqueBackdrop } from './components/MosqueArtwork';
import { Sidebar } from './components/Sidebar';
import { TransactionModal } from './components/TransactionModal';
import { DashboardView } from './components/views/DashboardView';
import { GoogleSheetsView } from './components/views/GoogleSheetsView';
import { LaporanView } from './components/views/LaporanView';
import { PemasukanView } from './components/views/PemasukanView';
import { PengaturanView } from './components/views/PengaturanView';
import { PengeluaranView } from './components/views/PengeluaranView';
import { RincianPengeluaranView } from './components/views/RincianPengeluaranView';
import { SumberPemasukanView } from './components/views/SumberPemasukanView';
import {
  clearCachedToken,
  googleSignIn,
  initAuth,
  logout as googleLogout,
} from './services/googleAuth';
import {
  INITIAL_MONTHLY_TARGETS,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS,
} from './data/initialData';
import {
  ExpenseCategory,
  IncomeSource,
  MonthlyTarget,
  MosqueSettings,
  NavPage,
  Transaction,
  TransactionType,
  UserRole,
} from './types';

const STORAGE_KEYS = {
  transactions: 'masjid_asysyifa_transactions_v1',
  targets: 'masjid_asysyifa_targets_v1',
  settings: 'masjid_asysyifa_settings_v1',
};

const PAGE_TITLES: Record<NavPage, string> = {
  dashboard: 'Dashboard Keuangan Masjid',
  pemasukan: 'Manajemen Pemasukan',
  pengeluaran: 'Ringkasan Pengeluaran',
  'sumber-pemasukan': 'Sumber Pemasukan Dana',
  'rincian-pengeluaran': 'Rincian Pengeluaran',
  laporan: 'Laporan Keuangan Masjid',
  'google-sheets': 'Sinkronisasi Google Sheets',
  pengaturan: 'Pengaturan Masjid & Target',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-11');
  const [userRole, setUserRole] = useState<UserRole>('Takmir');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullView, setIsFullView] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.transactions, INITIAL_TRANSACTIONS)
  );
  const [monthlyTargets, setMonthlyTargets] = useState<MonthlyTarget[]>(() =>
    loadFromStorage(STORAGE_KEYS.targets, INITIAL_MONTHLY_TARGETS)
  );
  const [settings, setSettings] = useState<MosqueSettings>(() =>
    loadFromStorage(STORAGE_KEYS.settings, INITIAL_SETTINGS)
  );

  // Dropdown states
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);

  // Transaction Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] =
    useState<TransactionType>('pemasukan');
  const [modalInitialCategory, setModalInitialCategory] = useState<
    IncomeSource | ExpenseCategory | undefined
  >(undefined);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Google Workspace Auth state (token held strictly in memory)
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState(true);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        setNeedsGoogleAuth(false);
      },
      (user) => {
        setGoogleUser(user);
        setGoogleToken(null);
        setNeedsGoogleAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.transactions,
        JSON.stringify(transactions)
      );
    } catch {
      // Ignore quota errors
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.targets,
        JSON.stringify(monthlyTargets)
      );
    } catch {
      // Ignore quota errors
    }
  }, [monthlyTargets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
    } catch {
      // Ignore quota errors
    }
  }, [settings]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (periodRef.current && !periodRef.current.contains(e.target as Node)) {
        setPeriodDropdownOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (
        viewMenuRef.current &&
        !viewMenuRef.current.contains(e.target as Node)
      ) {
        setViewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync browser fullscreen state and Esc key exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fsActive = Boolean(document.fullscreenElement);
      setIsBrowserFullscreen(fsActive);
      if (!fsActive) {
        setIsFullView((prev) => prev);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullView && !modalOpen) {
        setIsFullView(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullView, modalOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const openNewTransactionModal = (
    type: TransactionType,
    category?: IncomeSource | ExpenseCategory
  ) => {
    setEditingTx(null);
    setModalInitialType(type);
    setModalInitialCategory(category);
    setModalOpen(true);
  };

  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id'>,
    editId?: string
  ) => {
    if (editId) {
      setTransactions((prev) =>
        prev.map((item) =>
          item.id === editId ? { ...txData, id: editId } : item
        )
      );
      showToast('Perubahan transaksi berhasil disimpan.');
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}`,
      };
      setTransactions((prev) => [newTx, ...prev]);
      showToast('Transaksi baru berhasil dicatat.');
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Transaksi telah dihapus.');
  };

  const handleSaveSettings = (next: MosqueSettings) => {
    setSettings(next);
    showToast('Pengaturan masjid berhasil diperbarui.');
  };

  const handleUpdateTarget = (monthKey: string, nextAmount: number) => {
    setMonthlyTargets((prev) =>
      prev.map((m) =>
        m.monthKey === monthKey ? { ...m, targetAmount: nextAmount } : m
      )
    );
  };

  const handleResetAllData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setMonthlyTargets(INITIAL_MONTHLY_TARGETS);
    setSettings(INITIAL_SETTINGS);
    setSelectedPeriod('2026-11');
    showToast('Data dikembalikan ke pengaturan awal.');
  };

  const currentPeriodLabel =
    selectedPeriod === 'all'
      ? '01 Jun – 30 Nov 2026'
      : monthlyTargets.find((m) => m.monthKey === selectedPeriod)
          ?.dateRangeLabel || '01 – 30 Nov 2026';

  const enterWideDashboard = () => {
    setActivePage('dashboard');
    setIsFullView(true);
    setViewMenuOpen(false);
    showToast('Tampilan penuh dashboard aktif. Tekan Esc untuk kembali.');
  };

  const enterKioskFullscreen = async () => {
    setActivePage('dashboard');
    setIsFullView(true);
    setViewMenuOpen(false);
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      showToast('Mode layar penuh (TV Masjid) aktif.');
    } catch {
      showToast('Tampilan penuh dashboard aktif di jendela ini.');
    }
  };

  const exitFullView = async () => {
    setIsFullView(false);
    setViewMenuOpen(false);
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore fullscreen exit errors
    }
    showToast('Kembali ke tampilan normal.');
  };

  return (
    <div className="min-h-screen flex bg-[#ECF3EF] text-[#0F2E1F]">
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        settings={settings}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        isFullView={isFullView}
        onEnterFullView={enterWideDashboard}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="relative z-20 no-print bg-gradient-to-r from-[#F6FAF7] via-[#F2F8F4] to-[#E9F3ED] border-b border-[#DCE8E0] px-4 sm:px-7 py-4">
          <div className="pointer-events-none absolute inset-y-0 right-1/4 overflow-hidden hidden md:block">
            <HeaderMosqueBackdrop />
          </div>

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  isFullView
                    ? setIsFullView(false)
                    : setMobileMenuOpen(true)
                }
                className={`${
                  isFullView ? 'inline-flex' : 'lg:hidden inline-flex'
                } mt-1 sm:mt-0 rounded-xl border border-[#D4E2DA] bg-white p-2 text-[#0F3D28] hover:bg-[#EAF3EE] transition-colors`}
                aria-label={
                  isFullView
                    ? 'Tampilkan sidebar navigasi'
                    : 'Buka menu navigasi'
                }
                title={
                  isFullView ? 'Tampilkan Sidebar' : 'Buka Menu Navigasi'
                }
              >
                {isFullView ? (
                  <PanelLeftOpen className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <div>
                <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-[#0F3D28] leading-tight">
                  {PAGE_TITLES[activePage]}
                </h1>
                <p className="text-[13.5px] font-medium text-[#4A6658] mt-0.5">
                  {settings.mosqueName} {settings.institutionName}
                </p>
              </div>
            </div>

            {/* Right Controls: Full View Menu + Period Selector + Account/Role Selector */}
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto shrink-0">
              {/* Tampilan Penuh Menu Dropdown */}
              <div className="relative" ref={viewMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setViewMenuOpen((o) => !o);
                    setPeriodDropdownOpen(false);
                    setRoleDropdownOpen(false);
                  }}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-[13px] font-semibold shadow-2xs transition-colors whitespace-nowrap ${
                    isFullView || isBrowserFullscreen
                      ? 'border-[#0E6B43] bg-[#0E6B43] text-white hover:bg-[#0B5535]'
                      : 'border-[#D4E2DA] bg-white text-[#1B3A2B] hover:bg-[#F7FBF8]'
                  }`}
                >
                  {isFullView || isBrowserFullscreen ? (
                    <Minimize2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <Maximize2 className="w-4 h-4 text-[#0E6B43] shrink-0" />
                  )}
                  <span>
                    {isFullView || isBrowserFullscreen
                      ? 'Mode Penuh'
                      : 'Tampilan Penuh'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 ${
                      isFullView || isBrowserFullscreen
                        ? 'text-emerald-100'
                        : 'text-[#5D7366]'
                    }`}
                  />
                </button>

                {viewMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#D4E2DA] bg-white py-1.5 shadow-lg z-30">
                    <div className="px-3.5 py-1.5 text-[11px] font-semibold text-[#6B8477]">
                      Mode Tampilan Dashboard
                    </div>

                    <button
                      type="button"
                      onClick={enterWideDashboard}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs transition-colors ${
                        isFullView && !isBrowserFullscreen
                          ? 'bg-[#EAF3EE] text-[#0E6B43] font-bold'
                          : 'text-[#2B4839] hover:bg-[#F5F9F7] font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <PanelLeftClose className="w-4 h-4 shrink-0 text-[#0E6B43]" />
                        <span>Dashboard Lebar Penuh</span>
                      </span>
                      {isFullView && !isBrowserFullscreen && (
                        <Check className="w-3.5 h-3.5 text-[#0E6B43] shrink-0" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={enterKioskFullscreen}
                      className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs transition-colors ${
                        isBrowserFullscreen
                          ? 'bg-[#EAF3EE] text-[#0E6B43] font-bold'
                          : 'text-[#2B4839] hover:bg-[#F5F9F7] font-medium'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 shrink-0 text-[#0E6B43]" />
                        <span>Layar Penuh (TV Masjid)</span>
                      </span>
                      {isBrowserFullscreen && (
                        <Check className="w-3.5 h-3.5 text-[#0E6B43] shrink-0" />
                      )}
                    </button>

                    {(isFullView || isBrowserFullscreen) && (
                      <>
                        <div className="my-1 border-t border-[#EEF3EF]" />
                        <button
                          type="button"
                          onClick={exitFullView}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-[#D95D41] hover:bg-orange-50 transition-colors"
                        >
                          <Minimize2 className="w-4 h-4 shrink-0" />
                          <span>Kembali ke Tampilan Normal</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Period Dropdown */}
              <div className="relative" ref={periodRef}>
                <button
                  type="button"
                  onClick={() => {
                    setPeriodDropdownOpen((o) => !o);
                    setRoleDropdownOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D4E2DA] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#1B3A2B] shadow-2xs hover:bg-[#F7FBF8] transition-colors whitespace-nowrap"
                >
                  <Calendar className="w-4 h-4 text-[#0E6B43]" />
                  <span className="tabular-nums">{currentPeriodLabel}</span>
                  <ChevronDown className="w-4 h-4 text-[#5D7366]" />
                </button>

                {periodDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#D4E2DA] bg-white py-1.5 shadow-lg z-30">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-[#6B8477]">
                      Pilih Periode Laporan
                    </div>
                    {[...monthlyTargets].reverse().map((m) => (
                      <button
                        key={m.monthKey}
                        type="button"
                        onClick={() => {
                          setSelectedPeriod(m.monthKey);
                          setPeriodDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs font-medium transition-colors ${
                          selectedPeriod === m.monthKey
                            ? 'bg-[#EAF3EE] text-[#0E6B43] font-bold'
                            : 'text-[#2B4839] hover:bg-[#F5F9F7]'
                        }`}
                      >
                        <span>{m.fullLabel}</span>
                        <span className="text-[11px] text-[#6B8477] tabular-nums">
                          {m.dateRangeLabel}
                        </span>
                      </button>
                    ))}
                    <div className="my-1 border-t border-[#EEF3EF]" />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPeriod('all');
                        setPeriodDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs font-medium transition-colors ${
                        selectedPeriod === 'all'
                          ? 'bg-[#EAF3EE] text-[#0E6B43] font-bold'
                          : 'text-[#2B4839] hover:bg-[#F5F9F7]'
                      }`}
                    >
                      <span>Semua Periode (6 Bulan)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Role & Quick Action Dropdown */}
              <div className="relative" ref={roleRef}>
                <button
                  type="button"
                  onClick={() => {
                    setRoleDropdownOpen((o) => !o);
                    setPeriodDropdownOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D4E2DA] bg-white pl-2 pr-3 py-1.5 text-[13px] font-semibold text-[#1B3A2B] shadow-2xs hover:bg-[#F7FBF8] transition-colors whitespace-nowrap"
                >
                  <span className="w-7 h-7 rounded-full bg-[#0E6B43] text-white flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </span>
                  <span>{userRole}</span>
                  <ChevronDown className="w-4 h-4 text-[#5D7366]" />
                </button>

                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#D4E2DA] bg-white py-1.5 shadow-lg z-30">
                    {userRole !== 'Jamaah' && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            openNewTransactionModal('pemasukan');
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-[#0E6B43] hover:bg-[#EAF3EE]"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Catat Transaksi Baru</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setRoleDropdownOpen(false);
                        setActivePage('google-sheets');
                      }}
                      className="w-full flex items-center justify-between gap-2 px-3.5 py-2 text-left text-xs font-semibold text-[#1B3A2B] hover:bg-[#EAF3EE]"
                    >
                      <span className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-[#0E6B43]" />
                        <span>Google Sheets</span>
                      </span>
                      <span className="text-[10.5px] text-[#5D7366]">
                        {googleToken ? 'Terhubung' : 'Hubungkan'}
                      </span>
                    </button>
                    <div className="my-1 border-t border-[#EEF3EF]" />
                    <div className="px-3 py-1 text-[11px] font-semibold text-[#6B8477]">
                      Mode Akses Tampilan
                    </div>
                    {(['Takmir', 'Bendahara', 'Jamaah'] as UserRole[]).map(
                      (role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            setUserRole(role);
                            setRoleDropdownOpen(false);
                            showToast(`Mode akses beralih ke ${role}.`);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs font-medium ${
                            userRole === role
                              ? 'bg-[#EAF3EE] text-[#0E6B43] font-bold'
                              : 'text-[#2B4839] hover:bg-[#F5F9F7]'
                          }`}
                        >
                          <span>{role}</span>
                          <span className="text-[11px] text-[#6B8477]">
                            {role === 'Jamaah' ? 'Hanya Baca' : 'Kelola Data'}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main
          className={`flex-1 p-4 sm:p-6 w-full mx-auto transition-all duration-200 ${
            isFullView ? 'max-w-none sm:px-8' : 'max-w-[1440px]'
          }`}
        >
          {activePage === 'dashboard' && (
            <DashboardView
              transactions={transactions}
              monthlyTargets={monthlyTargets}
              selectedPeriod={selectedPeriod}
              onSelectPeriod={setSelectedPeriod}
              onNavigate={setActivePage}
              settings={settings}
            />
          )}

          {activePage === 'pemasukan' && (
            <PemasukanView
              transactions={transactions}
              monthlyTargets={monthlyTargets}
              selectedPeriod={selectedPeriod}
              onSelectPeriod={setSelectedPeriod}
              userRole={userRole}
              onAddIncome={() => openNewTransactionModal('pemasukan')}
              onEditTransaction={(tx) => {
                setEditingTx(tx);
                setModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activePage === 'pengeluaran' && (
            <PengeluaranView
              transactions={transactions}
              selectedPeriod={selectedPeriod}
              userRole={userRole}
              onAddExpense={() => openNewTransactionModal('pengeluaran')}
              onNavigate={setActivePage}
            />
          )}

          {activePage === 'sumber-pemasukan' && (
            <SumberPemasukanView
              transactions={transactions}
              selectedPeriod={selectedPeriod}
              userRole={userRole}
              onAddIncomeForSource={(src) =>
                openNewTransactionModal('pemasukan', src)
              }
            />
          )}

          {activePage === 'rincian-pengeluaran' && (
            <RincianPengeluaranView
              transactions={transactions}
              selectedPeriod={selectedPeriod}
              userRole={userRole}
              onAddExpense={() => openNewTransactionModal('pengeluaran')}
              onEditTransaction={(tx) => {
                setEditingTx(tx);
                setModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activePage === 'laporan' && (
            <LaporanView
              transactions={transactions}
              monthlyTargets={monthlyTargets}
              selectedPeriod={selectedPeriod}
              settings={settings}
            />
          )}

          {activePage === 'google-sheets' && (
            <GoogleSheetsView
              googleUser={googleUser}
              accessToken={googleToken}
              needsAuth={needsGoogleAuth}
              isLoggingIn={isGoogleLoggingIn}
              onGoogleLogin={async () => {
                setIsGoogleLoggingIn(true);
                try {
                  const res = await googleSignIn();
                  setGoogleUser(res.user);
                  setGoogleToken(res.accessToken);
                  setNeedsGoogleAuth(false);
                  showToast('Berhasil terhubung dengan Google Sheets.');
                } catch {
                  showToast('Gagal masuk dengan akun Google.');
                } finally {
                  setIsGoogleLoggingIn(false);
                }
              }}
              onGoogleLogout={async () => {
                await googleLogout();
                setGoogleUser(null);
                setGoogleToken(null);
                setNeedsGoogleAuth(true);
                showToast('Koneksi Google Sheets diputuskan.');
              }}
              onAuthExpired={() => {
                clearCachedToken();
                setGoogleToken(null);
                setNeedsGoogleAuth(true);
              }}
              transactions={transactions}
              onImportTransactions={(imported, mode) => {
                if (mode === 'replace') {
                  setTransactions(imported);
                } else {
                  setTransactions((prev) => {
                    const existingIds = new Set(prev.map((t) => t.id));
                    const additions = imported.filter(
                      (t) => !existingIds.has(t.id)
                    );
                    return [...additions, ...prev];
                  });
                }
              }}
              settings={settings}
              userRole={userRole}
              onShowToast={showToast}
            />
          )}

          {activePage === 'pengaturan' && (
            <PengaturanView
              settings={settings}
              monthlyTargets={monthlyTargets}
              userRole={userRole}
              onSaveSettings={handleSaveSettings}
              onUpdateTarget={handleUpdateTarget}
              onResetAllData={handleResetAllData}
            />
          )}
        </main>
      </div>

      {/* Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        initialType={modalInitialType}
        initialCategory={modalInitialCategory}
        editingTransaction={editingTx}
        defaultMonthKey={selectedPeriod === 'all' ? '2026-11' : selectedPeriod}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="no-print fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-[#0B462D] px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
