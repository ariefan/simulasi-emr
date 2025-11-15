import { Link, Navigate, createFileRoute, useNavigate } from '@tanstack/react-router';
import { FileText, Home, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useDashboardStats } from '@/hooks/use-progress';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch dashboard statistics
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats(user?.id || 0);

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds <= 0) return '0 m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs} j ${mins} m`;
    }
    if (mins > 0) {
      return `${mins} m`;
    }
    return `${secs} dtk`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const menuItems = [
    { icon: Home, label: 'Dasbor', href: '/dashboard' },
    { icon: FileText, label: 'Pembelajaran', href: '/pembelajaran' },
  ];

  const Sidebar = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-bold">Sistem RME</h2>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            onClick={() => onItemClick?.()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => {
            handleLogout();
            onItemClick?.();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-red-400"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r border-slate-200">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden absolute top-4 left-4 z-50"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar onItemClick={() => setIsSidebarOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="md:hidden w-10"></div>
              <h1 className="text-xl font-semibold">Dasbor</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-right">
                <p className="font-medium">{user.name}</p>
                <p className="text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  Total Percobaan
                </h3>
                <p className="text-3xl font-bold">
                  {isLoadingStats ? '...' : stats?.totalAttempts || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  Kasus Selesai
                </h3>
                <p className="text-3xl font-bold">
                  {isLoadingStats ? '...' : stats?.completedCases || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  Nilai Rata-rata
                </h3>
                <p className="text-3xl font-bold">
                  {isLoadingStats ? '...' : stats?.averageScore || 0}%
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  Total Refleksi
                </h3>
                <p className="text-3xl font-bold">
                  {isLoadingStats ? '...' : stats?.totalReflections || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  Rata-rata Waktu / Kasus
                </h3>
                <p className="text-3xl font-bold">
                  {isLoadingStats ? '...' : formatDuration(stats?.averageTimeSeconds)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  Total Waktu Belajar
                </h3>
                <p className="text-3xl font-bold">
                  {isLoadingStats ? '...' : formatDuration(stats?.totalStudySeconds)}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  Waktu Belajar Hari Ini
                </h3>
                <p className="text-3xl font-bold">
                  {isLoadingStats ? '...' : formatDuration(stats?.timeSpentTodaySeconds)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Selamat Datang di Sistem Pembelajaran RME Koas</h2>
              <p className="text-slate-600 mb-4">
                Lacak progres pembelajaran klinis Anda dan eksplorasi kasus-kasus medis. Gunakan sidebar untuk
                navigasi ke Pembelajaran untuk mulai berlatih dengan simulasi kasus.
              </p>
              {stats && stats.totalAttempts === 0 && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Anda belum memulai kasus apapun. Kunjungi halaman{' '}
                    <Link to="/pembelajaran" className="font-semibold underline">
                      Pembelajaran
                    </Link>{' '}
                    untuk memulai pelatihan klinis Anda.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
