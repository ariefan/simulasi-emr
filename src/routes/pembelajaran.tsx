import { Link, Navigate, createFileRoute, useNavigate } from '@tanstack/react-router';
import { FileText, Home, LogOut, Menu, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { CaseData, StudentProgress } from '@/types/case';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export const Route = createFileRoute('/pembelajaran')({
  component: PembelajaranPage,
});

function PembelajaranPage() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cases, setCases] = useState<Array<CaseData>>([]);
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [studentProgress, setStudentProgress] = useState<StudentProgress>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [reflection, setReflection] = useState({ what: '', so_what: '', now_what: '' });

  useEffect(() => {
    // Load cases from JSON
    fetch('/cases_internal_bedah_obg.json')
      .then((res) => res.json())
      .then((data) => {
        setCases(data);
        if (data.length > 0) {
          setSelectedCase(data[0]);
        }
      })
      .catch((error) => {
        console.error('Error loading cases:', error);
        toast.error('Failed to load cases');
      });

    // Load student progress from localStorage
    const savedProgress = localStorage.getItem('student_progress');
    if (savedProgress) {
      setStudentProgress(JSON.parse(savedProgress));
    }
  }, []);

  useEffect(() => {
    // Load reflection for selected case
    if (selectedCase) {
      const caseProgress = studentProgress[selectedCase.case_id];
      if (caseProgress?.reflection) {
        setReflection({
          what: caseProgress.reflection.what || '',
          so_what: caseProgress.reflection.so_what || '',
          now_what: caseProgress.reflection.now_what || '',
        });
      } else {
        setReflection({ what: '', so_what: '', now_what: '' });
      }
      setSelectedAnswers({});
      setQuizSubmitted(false);
    }
  }, [selectedCase, studentProgress]);

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

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.case_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.skdi_diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.chief_complaint.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === 'all' || c.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = ['all', ...Array.from(new Set(cases.map((c) => c.department)))];

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    if (!quizSubmitted) {
      setSelectedAnswers({ ...selectedAnswers, [questionId]: answerIndex });
    }
  };

  const handleQuizSubmit = () => {
    if (!selectedCase?.assessment_items?.possible_mcq_questions) return;

    const questions = selectedCase.assessment_items.possible_mcq_questions;
    let correct = 0;

    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.answer_index) {
        correct++;
      }
    });

    const score = (correct / questions.length) * 100;
    setQuizSubmitted(true);

    // Update progress
    const updatedProgress = {
      ...studentProgress,
      [selectedCase.case_id]: {
        attempts: (studentProgress[selectedCase.case_id]?.attempts || 0) + 1,
        lastScore: score,
        reflection: studentProgress[selectedCase.case_id]?.reflection,
      },
    };
    setStudentProgress(updatedProgress);
    localStorage.setItem('student_progress', JSON.stringify(updatedProgress));

    toast.success(`Quiz submitted! Score: ${score.toFixed(0)}%`);
  };

  const handleReflectionSave = () => {
    if (!selectedCase) return;

    const updatedProgress = {
      ...studentProgress,
      [selectedCase.case_id]: {
        ...studentProgress[selectedCase.case_id],
        attempts: studentProgress[selectedCase.case_id]?.attempts || 0,
        lastScore: studentProgress[selectedCase.case_id]?.lastScore || 0,
        reflection: {
          what: reflection.what,
          so_what: reflection.so_what,
          now_what: reflection.now_what,
        },
        reflection_last_saved: new Date().toISOString(),
      },
    };

    setStudentProgress(updatedProgress);
    localStorage.setItem('student_progress', JSON.stringify(updatedProgress));
    toast.success('Reflection saved!');
  };

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
              <h1 className="text-xl font-semibold">Pembelajaran Kasus</h1>
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
        <main className="flex-1 p-4 md:p-6 bg-slate-50">
          <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Case List Sidebar - Hidden on mobile, visible on large screens */}
            <Card className="hidden lg:block w-full lg:w-80 xl:w-96 h-auto lg:h-[calc(100vh-180px)] shrink-0">
              <CardHeader>
                <CardTitle>Daftar Kasus</CardTitle>
                <CardDescription>Pilih kasus untuk dipelajari</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                </div>

                <ScrollArea className="h-64 lg:h-[calc(100vh-400px)]">
                  <div className="space-y-2">
                    {filteredCases.map((c) => (
                      <button
                        key={c.case_id}
                        onClick={() => setSelectedCase(c)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedCase?.case_id === c.case_id
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{c.case_id}</p>
                            <p className="text-xs text-slate-600 truncate">
                              {c.skdi_diagnosis}
                            </p>
                            <div className="flex gap-1 mt-2">
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
                            </div>
                          </div>
                        </div>
                        {studentProgress[c.case_id] && (
                          <div className="mt-2 text-xs text-slate-500">
                            Attempts: {studentProgress[c.case_id].attempts} | Last
                            Score: {studentProgress[c.case_id].lastScore.toFixed(0)}%
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Case Details */}
              <Card className="flex-1 h-auto lg:h-[calc(100vh-180px)]">
                <CardHeader>
                  <CardTitle>
                    {selectedCase?.case_id || 'Pilih Kasus'}
                  </CardTitle>
                  <CardDescription>
                    {selectedCase?.skdi_diagnosis || 'Tidak ada kasus dipilih'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedCase ? (
                    <Tabs defaultValue="identitas" className="h-full">
                      <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-1">
                        <TabsTrigger value="identitas" className="text-xs md:text-sm">Identitas</TabsTrigger>
                        <TabsTrigger value="anamnesis" className="text-xs md:text-sm">Anamnesis</TabsTrigger>
                        <TabsTrigger value="pemeriksaan" className="text-xs md:text-sm">Pemeriksaan</TabsTrigger>
                        <TabsTrigger value="lab" className="text-xs md:text-sm">Lab</TabsTrigger>
                        <TabsTrigger value="diagnosis" className="text-xs md:text-sm">Diagnosis</TabsTrigger>
                        <TabsTrigger value="refleksi" className="text-xs md:text-sm">Refleksi</TabsTrigger>
                      </TabsList>

                      <ScrollArea className="h-96 lg:h-[calc(100vh-340px)] mt-4">
                        <TabsContent value="identitas" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold">Nama</Label>
                              <p>{selectedCase.patient.name}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Usia</Label>
                              <p>{selectedCase.patient.age} tahun</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Jenis Kelamin</Label>
                              <p>{selectedCase.patient.sex === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Status Pernikahan</Label>
                              <p>{selectedCase.patient.marital_status || '-'}</p>
                            </div>
                            {selectedCase.patient.gravida !== null && (
                              <div>
                                <Label className="font-semibold">Gravida</Label>
                                <p>{selectedCase.patient.gravida}</p>
                              </div>
                            )}
                            {selectedCase.patient.para !== null && (
                              <div>
                                <Label className="font-semibold">Para</Label>
                                <p>{selectedCase.patient.para}</p>
                              </div>
                            )}
                            <div>
                              <Label className="font-semibold">Alamat</Label>
                              <p>{selectedCase.patient.address_type || '-'}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Asuransi</Label>
                              <p>{selectedCase.patient.insurance_status || '-'}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="font-semibold">Keluhan Utama</Label>
                            <p className="mt-1">{selectedCase.chief_complaint}</p>
                          </div>
                        </TabsContent>

                        <TabsContent value="anamnesis" className="space-y-4">
                          <div>
                            <Label className="font-semibold">Riwayat Penyakit Sekarang</Label>
                            <p className="mt-1 whitespace-pre-wrap">
                              {selectedCase.history_of_present_illness}
                            </p>
                          </div>
                          {selectedCase.past_medical_history && (
                            <div>
                              <Label className="font-semibold">Riwayat Penyakit Dahulu</Label>
                              <p className="mt-1">{selectedCase.past_medical_history}</p>
                            </div>
                          )}
                          {selectedCase.family_history && (
                            <div>
                              <Label className="font-semibold">Riwayat Penyakit Keluarga</Label>
                              <p className="mt-1">{selectedCase.family_history}</p>
                            </div>
                          )}
                          {selectedCase.social_history && (
                            <div>
                              <Label className="font-semibold">Riwayat Sosial</Label>
                              <p className="mt-1">{selectedCase.social_history}</p>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="pemeriksaan" className="space-y-4">
                          {selectedCase.physical_exam.general && (
                            <div>
                              <Label className="font-semibold">Keadaan Umum</Label>
                              <p className="mt-1">{selectedCase.physical_exam.general}</p>
                            </div>
                          )}
                          {selectedCase.physical_exam.vital_signs && (
                            <div>
                              <Label className="font-semibold">Tanda Vital</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                                {selectedCase.physical_exam.vital_signs.bp_mmHg && (
                                  <p>TD: {selectedCase.physical_exam.vital_signs.bp_mmHg}</p>
                                )}
                                {selectedCase.physical_exam.vital_signs.hr_bpm && (
                                  <p>Nadi: {selectedCase.physical_exam.vital_signs.hr_bpm} bpm</p>
                                )}
                                {selectedCase.physical_exam.vital_signs.rr_per_min && (
                                  <p>RR: {selectedCase.physical_exam.vital_signs.rr_per_min} /menit</p>
                                )}
                                {selectedCase.physical_exam.vital_signs.temp_c && (
                                  <p>Suhu: {selectedCase.physical_exam.vital_signs.temp_c}°C</p>
                                )}
                                {selectedCase.physical_exam.vital_signs.spo2_percent && (
                                  <p>SpO2: {selectedCase.physical_exam.vital_signs.spo2_percent}%</p>
                                )}
                              </div>
                            </div>
                          )}
                          {selectedCase.physical_exam.systemic && (
                            <div>
                              <Label className="font-semibold">Pemeriksaan Sistemik</Label>
                              <div className="space-y-2 mt-1">
                                {selectedCase.physical_exam.systemic.respiratory && (
                                  <div>
                                    <p className="font-medium text-sm">Respirasi:</p>
                                    <p className="text-sm">{selectedCase.physical_exam.systemic.respiratory}</p>
                                  </div>
                                )}
                                {selectedCase.physical_exam.systemic.cardiovascular && (
                                  <div>
                                    <p className="font-medium text-sm">Kardiovaskular:</p>
                                    <p className="text-sm">{selectedCase.physical_exam.systemic.cardiovascular}</p>
                                  </div>
                                )}
                                {selectedCase.physical_exam.systemic.abdomen && (
                                  <div>
                                    <p className="font-medium text-sm">Abdomen:</p>
                                    <p className="text-sm">{selectedCase.physical_exam.systemic.abdomen}</p>
                                  </div>
                                )}
                                {selectedCase.physical_exam.systemic.neuro && (
                                  <div>
                                    <p className="font-medium text-sm">Neurologi:</p>
                                    <p className="text-sm">{selectedCase.physical_exam.systemic.neuro}</p>
                                  </div>
                                )}
                                {selectedCase.physical_exam.systemic.extremities && (
                                  <div>
                                    <p className="font-medium text-sm">Ekstremitas:</p>
                                    <p className="text-sm">{selectedCase.physical_exam.systemic.extremities}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {selectedCase.physical_exam.obstetric_exam && (
                            <div>
                              <Label className="font-semibold">Pemeriksaan Obstetrik</Label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                                {selectedCase.physical_exam.obstetric_exam.tfu_cm && (
                                  <p>TFU: {selectedCase.physical_exam.obstetric_exam.tfu_cm} cm</p>
                                )}
                                {selectedCase.physical_exam.obstetric_exam.fetal_heart_rate_bpm && (
                                  <p>DJJ: {selectedCase.physical_exam.obstetric_exam.fetal_heart_rate_bpm} bpm</p>
                                )}
                                {selectedCase.physical_exam.obstetric_exam.presentation && (
                                  <p>Presentasi: {selectedCase.physical_exam.obstetric_exam.presentation}</p>
                                )}
                                {selectedCase.physical_exam.obstetric_exam.edema && (
                                  <p>Edema: {selectedCase.physical_exam.obstetric_exam.edema}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="lab" className="space-y-4">
                          {selectedCase.laboratory && (
                            <div>
                              <Label className="font-semibold">Pemeriksaan Laboratorium</Label>
                              <div className="mt-2 space-y-1">
                                {Object.entries(selectedCase.laboratory).map(([key, value]) => (
                                  <p key={key} className="text-sm">
                                    <span className="font-medium">{key}:</span>{' '}
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedCase.imaging && (
                            <div>
                              <Label className="font-semibold">Pemeriksaan Penunjang</Label>
                              <div className="mt-2 space-y-1">
                                {Object.entries(selectedCase.imaging).map(([key, value]) => (
                                  <p key={key} className="text-sm">
                                    <span className="font-medium">{key}:</span> {value}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="diagnosis" className="space-y-4">
                          <div>
                            <Label className="font-semibold">Diagnosis Kerja</Label>
                            <p className="mt-1">{selectedCase.working_diagnosis}</p>
                          </div>
                          {selectedCase.differential_diagnoses && selectedCase.differential_diagnoses.length > 0 && (
                            <div>
                              <Label className="font-semibold">Diagnosis Banding</Label>
                              <ul className="mt-1 list-disc list-inside">
                                {selectedCase.differential_diagnoses.map((dd, idx) => (
                                  <li key={idx}>{dd}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {selectedCase.management_plan && (
                            <div>
                              <Label className="font-semibold">Rencana Tatalaksana</Label>
                              <div className="mt-2 space-y-2">
                                {selectedCase.management_plan.non_pharmacological && (
                                  <div>
                                    <p className="font-medium text-sm">Non-Farmakologis:</p>
                                    <ul className="list-disc list-inside text-sm">
                                      {selectedCase.management_plan.non_pharmacological.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {selectedCase.management_plan.pharmacological && (
                                  <div>
                                    <p className="font-medium text-sm">Farmakologis:</p>
                                    <ul className="list-disc list-inside text-sm">
                                      {selectedCase.management_plan.pharmacological.map((item, idx) => (
                                        <li key={idx}>{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {selectedCase.management_plan.procedure && (
                                  <div>
                                    <p className="font-medium text-sm">Prosedur:</p>
                                    <p className="text-sm">{selectedCase.management_plan.procedure}</p>
                                  </div>
                                )}
                                {selectedCase.management_plan.monitoring && (
                                  <div>
                                    <p className="font-medium text-sm">Monitoring:</p>
                                    <p className="text-sm">{selectedCase.management_plan.monitoring}</p>
                                  </div>
                                )}
                                {selectedCase.management_plan.referral && (
                                  <div>
                                    <p className="font-medium text-sm">Rujukan:</p>
                                    <p className="text-sm">{selectedCase.management_plan.referral}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {selectedCase.red_flags && selectedCase.red_flags.length > 0 && (
                            <div>
                              <Label className="font-semibold text-red-600">Red Flags</Label>
                              <ul className="mt-1 list-disc list-inside">
                                {selectedCase.red_flags.map((flag, idx) => (
                                  <li key={idx} className="text-red-600">{flag}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {selectedCase.learning_points && selectedCase.learning_points.length > 0 && (
                            <div>
                              <Label className="font-semibold">Poin Pembelajaran</Label>
                              <ul className="mt-1 list-disc list-inside">
                                {selectedCase.learning_points.map((point, idx) => (
                                  <li key={idx}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="refleksi" className="space-y-4">
                          <div>
                            <Label htmlFor="what">What? (Apa yang terjadi?)</Label>
                            <Textarea
                              id="what"
                              placeholder="Jelaskan apa yang Anda pelajari dari kasus ini..."
                              value={reflection.what}
                              onChange={(e) =>
                                setReflection({ ...reflection, what: e.target.value })
                              }
                              className="mt-1"
                              rows={4}
                            />
                          </div>
                          <div>
                            <Label htmlFor="so_what">So What? (Apa makna/signifikansinya?)</Label>
                            <Textarea
                              id="so_what"
                              placeholder="Jelaskan mengapa pembelajaran ini penting..."
                              value={reflection.so_what}
                              onChange={(e) =>
                                setReflection({ ...reflection, so_what: e.target.value })
                              }
                              className="mt-1"
                              rows={4}
                            />
                          </div>
                          <div>
                            <Label htmlFor="now_what">Now What? (Apa yang akan Anda lakukan?)</Label>
                            <Textarea
                              id="now_what"
                              placeholder="Jelaskan bagaimana Anda akan menerapkan pembelajaran ini..."
                              value={reflection.now_what}
                              onChange={(e) =>
                                setReflection({ ...reflection, now_what: e.target.value })
                              }
                              className="mt-1"
                              rows={4}
                            />
                          </div>
                          <Button onClick={handleReflectionSave} className="w-full">
                            Simpan Refleksi
                          </Button>
                          {studentProgress[selectedCase.case_id]?.reflection_last_saved && (
                            <p className="text-xs text-slate-500 text-center">
                              Terakhir disimpan:{' '}
                              {new Date(
                                studentProgress[selectedCase.case_id].reflection_last_saved!
                              ).toLocaleString('id-ID')}
                            </p>
                          )}
                        </TabsContent>
                      </ScrollArea>
                    </Tabs>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      Pilih kasus dari daftar untuk memulai pembelajaran
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quiz Panel */}
              <Card className="w-full lg:w-96 xl:w-[28rem] h-auto lg:h-[calc(100vh-180px)] shrink-0">
                <CardHeader>
                  <CardTitle>Soal Latihan</CardTitle>
                  <CardDescription>
                    {selectedCase?.assessment_items?.possible_mcq_questions?.length || 0} soal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedCase?.assessment_items?.possible_mcq_questions ? (
                    <div className="space-y-4">
                      <ScrollArea className="h-96 lg:h-[calc(100vh-380px)]">
                        <div className="space-y-6 pr-4">
                          {selectedCase.assessment_items.possible_mcq_questions.map((q, idx) => (
                            <div key={q.id} className="space-y-2">
                              <p className="font-medium text-sm">
                                {idx + 1}. {q.stem}
                              </p>
                              <div className="space-y-1">
                                {q.options.map((option, optIdx) => {
                                  const isSelected = selectedAnswers[q.id] === optIdx;
                                  const isCorrect = q.answer_index === optIdx;
                                  const showCorrect = quizSubmitted && isCorrect;
                                  const showWrong = quizSubmitted && isSelected && !isCorrect;

                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() => handleAnswerSelect(q.id, optIdx)}
                                      disabled={quizSubmitted}
                                      className={`w-full text-left p-2 text-sm rounded border transition-colors ${showCorrect
                                        ? 'bg-green-100 border-green-500'
                                        : showWrong
                                          ? 'bg-red-100 border-red-500'
                                          : isSelected
                                            ? 'bg-blue-50 border-blue-500'
                                            : 'bg-white border-slate-200 hover:bg-slate-50'
                                        } ${quizSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                      {String.fromCharCode(65 + optIdx)}. {option}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="space-y-2">
                        {!quizSubmitted ? (
                          <Button
                            onClick={handleQuizSubmit}
                            className="w-full"
                            disabled={
                              Object.keys(selectedAnswers).length !==
                              selectedCase.assessment_items.possible_mcq_questions.length
                            }
                          >
                            Submit Quiz
                          </Button>
                        ) : (
                          <div className="text-center">
                            <p className="text-lg font-semibold">
                              Score:{' '}
                              {(
                                (Object.entries(selectedAnswers).filter(
                                  ([qId, ansIdx]) =>
                                    selectedCase.assessment_items?.possible_mcq_questions?.find(
                                      (q) => q.id === qId
                                    )?.answer_index === ansIdx
                                ).length /
                                  (selectedCase.assessment_items?.possible_mcq_questions?.length || 1)) *
                                100
                              ).toFixed(0)}
                              %
                            </p>
                            <Button
                              onClick={() => {
                                setSelectedAnswers({});
                                setQuizSubmitted(false);
                              }}
                              variant="outline"
                              className="w-full mt-2"
                            >
                              Try Again
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                      Tidak ada soal untuk kasus ini
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
