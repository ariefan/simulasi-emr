import React from 'react';
import { RotateCcw, Printer, Sun, Moon, CheckCircle2, Menu, User } from 'lucide-react';

interface NavbarProps {
  studentName: string;
  onStudentNameChange: (name: string) => void;
  onResetKiosk: () => void;
  onOpenReport: () => void;
  totalCompletedCases: number;
  totalCases: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  studentName,
  onStudentNameChange,
  onResetKiosk,
  onOpenReport,
  totalCompletedCases,
  totalCases,
  theme,
  onToggleTheme,
  onToggleSidebar,
}) => {
  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-4 flex items-center justify-between z-30 sticky top-0 no-print transition-colors shrink-0">
      {/* Left: Hamburger (Tablet/Mobile) + Brand */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Buka Daftar Kasus"
            className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
            Simulator RME
          </span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded">
            SKDI v2.0
          </span>
        </div>
      </div>

      {/* Center: Student Name Profile (Adaptive on mobile) */}
      <div className="flex-1 max-w-xs mx-2 sm:mx-4">
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 w-full">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={studentName}
            onChange={(e) => onStudentNameChange(e.target.value)}
            placeholder="Nama Dokter Muda..."
            className="bg-transparent border-none text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none w-full font-medium"
          />
        </div>
      </div>

      {/* Right Actions & Progress */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Cases Completed Counter */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700/60 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span><strong className="text-slate-900 dark:text-slate-200">{totalCompletedCases}/{totalCases}</strong> Selesai</span>
        </div>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition touch-manipulation min-h-[40px] min-w-[40px] flex items-center justify-center"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Print / Report Button */}
        <button
          onClick={onOpenReport}
          title="Cetak Transkrip / Resume"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm min-h-[40px] touch-manipulation"
        >
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline">Transkrip</span>
        </button>

        {/* Reset Kiosk Button */}
        <button
          onClick={onResetKiosk}
          title="Reset Sesi untuk Pengunjung Berikutnya"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition min-h-[40px] touch-manipulation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Reset Sesi</span>
        </button>
      </div>
    </header>
  );
};
