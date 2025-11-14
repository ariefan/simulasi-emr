import { Link, Navigate, createFileRoute, useNavigate } from '@tanstack/react-router';
import { FileText, Home, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: FileText, label: 'Pembelajaran', href: '/pembelajaran' },
  ];

  const Sidebar = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-bold">EMR System</h2>
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
          <span>Logout</span>
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
              <h1 className="text-xl font-semibold">Dashboard</h1>
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
                  Total Patients
                </h3>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  Today's Appointments
                </h3>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  Pending Records
                </h3>
                <p className="text-3xl font-bold">0</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-sm font-medium text-slate-500 mb-2">
                  Active Users
                </h3>
                <p className="text-3xl font-bold">1</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Welcome to EMR System</h2>
              <p className="text-slate-600">
                This is a simple Electronic Medical Records system. Use the sidebar to
                navigate through different sections.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
