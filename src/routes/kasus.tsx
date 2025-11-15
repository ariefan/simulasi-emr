import { Link, Navigate, createFileRoute, useNavigate } from '@tanstack/react-router';
import { FileText, Home, LogOut, Menu, Search } from 'lucide-react';
import { useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useCases, useDepartments } from '@/hooks/use-cases';
import { useStudentProgress } from '@/hooks/use-progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const Route = createFileRoute('/kasus')({
  component: KasusPage,
});

const skdiLevelOptions = ['all', '1', '2', '3', '4'];

function KasusPage() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedSkdiLevel, setSelectedSkdiLevel] = useState<string>('all');

  // Fetch cases from database
  const { data: cases = [], isLoading: casesLoading } = useCases({
    department: selectedDepartment,
    search: searchTerm,
    skdiLevel: selectedSkdiLevel,
  });

  // Fetch departments for filter
  const { data: departments = ['all'] } = useDepartments();

  // Fetch student progress
  const { data: studentProgress = {} } = useStudentProgress(user?.id || 0);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'mudah':
        return 'bg-green-500';
      case 'sedang':
        return 'bg-yellow-500';
      case 'sulit':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getSkdiBadgeClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-green-600 text-white';
      case 2:
        return 'bg-yellow-600 text-white';
      case 3:
        return 'bg-orange-600 text-white';
      case 4:
        return 'bg-red-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
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

  const handleCaseClick = (caseId: string) => {
    navigate({ to: '/pembelajaran', search: { caseId } });
  };

  const menuItems = [
    { icon: Home, label: 'Dasbor', href: '/dashboard' },
    { icon: FileText, label: 'Daftar Kasus', href: '/kasus' },
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
              <h1 className="text-xl font-semibold">Daftar Kasus</h1>
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
        <main className="flex-1 p-3 md:p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {/* Filters */}
            <Card className="mb-4">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-semibold">Filter Kasus</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Cari kasus..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept === 'all' ? 'Semua Departemen' : dept}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedSkdiLevel}
                    onChange={(e) => setSelectedSkdiLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  >
                    {skdiLevelOptions.map((level) => (
                      <option key={level} value={level}>
                        {level === 'all' ? 'Semua Level SKDI' : `Level ${level}`}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Case Cards Grid */}
            {casesLoading ? (
              <div className="text-center py-12">
                <p className="text-slate-500">Memuat kasus...</p>
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500">Tidak ada kasus ditemukan</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cases.map((c) => (
                  <Card
                    key={c.case_id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCaseClick(c.case_id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{c.case_id}</CardTitle>
                      <CardDescription className="text-sm">
                        {c.skdi_diagnosis}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {c.department}
                          </Badge>
                          {c.difficulty && (
                            <Badge
                              className={`text-xs ${getDifficultyColor(c.difficulty)} text-white`}
                            >
                              {c.difficulty}
                            </Badge>
                          )}
                          {c.skdi_level && (
                            <Badge
                              className={`text-xs ${getSkdiBadgeClass(c.skdi_level)}`}
                            >
                              SKDI {c.skdi_level}
                            </Badge>
                          )}
                        </div>
                        {studentProgress[c.case_id] && (
                          <div className="text-sm text-slate-600 pt-2 border-t">
                            <div className="flex justify-between">
                              <span>Percobaan:</span>
                              <span className="font-medium">
                                {studentProgress[c.case_id].attempts}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Skor Terakhir:</span>
                              <span className="font-medium">
                                {studentProgress[c.case_id].lastScore.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
