import React from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  FileSpreadsheet,
  FileText,
  Home,
  ListChecks,
  Maximize2,
  Settings,
  X,
} from 'lucide-react';
import { MosqueSettings, NavPage } from '../types';
import { SidebarMosqueCrest, SidebarMosqueFooter } from './MosqueArtwork';

interface SidebarProps {
  activePage: NavPage;
  onSelectPage: (page: NavPage) => void;
  settings: MosqueSettings;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  isFullView: boolean;
  onEnterFullView: () => void;
}

const NAV_ITEMS: { id: NavPage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'pemasukan', label: 'Pemasukan', icon: ArrowUp },
  { id: 'pengeluaran', label: 'Pengeluaran', icon: ArrowDown },
  { id: 'sumber-pemasukan', label: 'Sumber Pemasukan', icon: BarChart3 },
  { id: 'rincian-pengeluaran', label: 'Rincian Pengeluaran', icon: ListChecks },
  { id: 'laporan', label: 'Laporan', icon: FileText },
  { id: 'google-sheets', label: 'Google Sheets', icon: FileSpreadsheet },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
];

export function Sidebar({
  activePage,
  onSelectPage,
  settings,
  mobileOpen,
  onCloseMobile,
  isFullView,
  onEnterFullView,
}: SidebarProps) {
  const sidebarContent = (
    <aside className="flex h-full w-[250px] shrink-0 flex-col justify-between bg-gradient-to-b from-[#0C5034] via-[#0B462D] to-[#062F1E] text-white select-none">
      {/* Top Branding Crest */}
      <div>
        <div className="relative px-4 pt-4 pb-3 text-center border-b border-white/10">
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden absolute right-3 top-3 rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Tutup menu navigasi"
          >
            <X className="w-5 h-5" />
          </button>
          <SidebarMosqueCrest />
          <h2 className="mt-1 text-[17px] font-bold tracking-tight text-white leading-snug">
            {settings.mosqueName}
          </h2>
          <p className="text-[12.5px] text-emerald-100/85 leading-tight mt-0.5">
            {settings.institutionName}
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="px-3 py-4 space-y-1" aria-label="Menu utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectPage(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[14px] font-medium transition-colors duration-150 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#2D7F57] to-[#236A47] text-white shadow-sm'
                    : 'text-emerald-50/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive ? 'text-white' : 'text-emerald-200/85'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                onEnterFullView();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[14px] font-medium transition-colors duration-150 whitespace-nowrap text-emerald-50/85 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              <Maximize2 className="w-[18px] h-[18px] shrink-0 text-emerald-200/85" />
              <span className="truncate">Tampilan Penuh</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Architectural Illustration & Motto */}
      <div className="mt-auto">
        <SidebarMosqueFooter />
        <div className="bg-[#062E1D] px-4 pb-5 pt-2 text-center">
          <p className="text-[13px] italic font-medium text-emerald-50/90 leading-snug">
            {settings.motto.includes(',') ? (
              <>
                {settings.motto.split(',')[0]},
                <br />
                {settings.motto.split(',')[1]?.trim()}
              </>
            ) : (
              settings.motto
            )}
          </p>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Static Sidebar (hidden in Full Dashboard View) */}
      {!isFullView && (
        <div className="hidden lg:block shrink-0 no-print">{sidebarContent}</div>
      )}

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden no-print">
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
