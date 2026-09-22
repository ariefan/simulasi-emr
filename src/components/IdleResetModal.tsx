import React from 'react';
import { AlertTriangle, RefreshCw, Play } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-amber-500/10 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4 animate-pulse">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-slate-100">
          Masih Melanjutkan Simulasi?
        </h3>

        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Tidak ada aktivitas terdeteksi. Kiosk akan otomatis me-reset data simulasi untuk pengunjung booth berikutnya dalam:
        </p>

        <div className="my-5 flex items-center justify-center">
          <span className="text-4xl font-extrabold text-amber-400 tracking-wider bg-slate-950 px-5 py-2 rounded-xl border border-amber-500/30">
            {secondsRemaining}s
          </span>
        </div>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onStay}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Saya Masih di Sini</span>
          </button>

          <button
            onClick={onResetNow}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};
