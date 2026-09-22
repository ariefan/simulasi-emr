import { RotateCcw, Printer, Sun, Moon, CheckCircle2 } from 'lucide-react';


interface NavbarProps {
  studentName: string;
  onStudentNameChange: (name: string) => void;
  onResetKiosk: () => void;
  onOpenReport: () => void;
  totalCompletedCases: number;
  totalCases: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
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
}) => {
  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-30 sticky top-0 no-print transition-colors">
      {/* Brand & System Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-700 dark:bg-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          RME
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
              Simulator RME & Penalaran Klinis
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded">
              SKDI v2.0
            </span>
          </div>
        </div>
      </div>

      {/* Center: Student Name Profile */}
      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1 max-w-xs w-full">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Dokter Muda:</span>
        <input
          type="text"
          value={studentName}
          onChange={(e) => onStudentNameChange(e.target.value)}
          placeholder="Ketik nama Anda..."
          className="bg-transparent border-none text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none w-full font-medium"
        />
      </div>

      {/* Right Actions & Progress */}
      <div className="flex items-center gap-2">
        {/* Cases Completed Counter */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700/60">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Progres: <strong className="text-slate-900 dark:text-slate-200">{totalCompletedCases}/{totalCases}</strong></span>
        </div>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Print / Report Button */}
        <button
          onClick={onOpenReport}
          title="Cetak Transkrip / Resume"
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Transkrip</span>
        </button>

        {/* Reset Kiosk Button */}
        <button
          onClick={onResetKiosk}
          title="Reset Sesi untuk Pengunjung Berikutnya"
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Reset Sesi</span>
        </button>
      </div>
    </header>
  );
};
