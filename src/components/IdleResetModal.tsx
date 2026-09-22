import React from 'react';
import { AlertTriangle, Play, RotateCcw } from 'lucide-react';

interface IdleResetModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onStay: () => void;
  onResetNow: () => void;
}

export const IdleResetModal: React.FC<IdleResetModalProps> = ({
  isOpen,
  secondsRemaining,
  onStay,
  onResetNow,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Lanjutkan Simulasi?
        </h3>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
          Tidak ada aktivitas terdeteksi. Sesi simulasi akan di-reset otomatis untuk pengunjung booth berikutnya dalam:
        </p>

        <div className="my-4">
          <span className="text-3xl font-bold font-mono text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            {secondsRemaining}s
          </span>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={onStay}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Saya Masih di Sini</span>
          </button>

          <button
            onClick={onResetNow}
            className="w-full py-2 px-4 rounded-lg bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium text-xs transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
