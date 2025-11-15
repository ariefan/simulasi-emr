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
                        <TabsTrigger value="pemeriksaan" className="text-xs md:text-sm">Pemeriksaan Fisik</TabsTrigger>
                        <TabsTrigger value="lab" className="text-xs md:text-sm">Lab & Penunjang</TabsTrigger>
                        <TabsTrigger value="diagnosis" className="text-xs md:text-sm">Diagnosis & Plan</TabsTrigger>
                        <TabsTrigger value="refleksi" className="text-xs md:text-sm">Refleksi</TabsTrigger>
                      </TabsList>

                      <ScrollArea className="h-96 lg:h-[calc(100vh-340px)] mt-4">
                        <TabsContent value="identitas" className="space-y-4">
                          <div className="section-title font-semibold text-sm">Identitas Pasien</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="font-semibold">Nama:</Label>
                              <p>{selectedCase.patient.name}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Umur:</Label>
                              <p>{selectedCase.patient.age} tahun</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Jenis kelamin:</Label>
                              <p>{selectedCase.patient.sex === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Status perkawinan:</Label>
                              <p>{selectedCase.patient.marital_status || '-'}</p>
                            </div>
                            {selectedCase.patient.gravida !== null && (
                              <div>
                                <Label className="font-semibold">Gravida:</Label>
                                <p>{selectedCase.patient.gravida}</p>
                              </div>
                            )}
                            {selectedCase.patient.para !== null && (
                              <div>
                                <Label className="font-semibold">Para:</Label>
                                <p>{selectedCase.patient.para}</p>
                              </div>
                            )}
                            <div>
                              <Label className="font-semibold">Konteks:</Label>
                              <p>{selectedCase.patient.address_type || '-'}</p>
                            </div>
                            <div>
                              <Label className="font-semibold">Jaminan:</Label>
                              <p>{selectedCase.patient.insurance_status || '-'}</p>
                            </div>
                          </div>
                          <hr className="my-2" />
                          <div className="section-title font-semibold text-sm">Ringkasan Kasus</div>
                          <div>
                            <Label className="font-semibold">Keluhan utama:</Label>
                            <p className="mt-1">{selectedCase.chief_complaint}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Diagnosis kerja:</Label>
                            <p className="mt-1">{selectedCase.working_diagnosis}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">ICD-10:</Label>
                            <p className="mt-1">{selectedCase.icd10}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Level SKDI:</Label>
                            <p className="mt-1">{selectedCase.skdi_level}</p>
                          </div>
                        </TabsContent>

                        <TabsContent value="anamnesis" className="space-y-4">
                          <div className="section-title font-semibold text-sm">Anamnesis</div>
                          <div>
                            <Label className="font-semibold">Keluhan utama:</Label>
                            <p className="mt-1">{selectedCase.chief_complaint}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Riwayat penyakit sekarang:</Label>
                            <p className="mt-1 whitespace-pre-wrap">
                              {selectedCase.history_of_present_illness}
                            </p>
                          </div>
                          <div>
                            <Label className="font-semibold">Riwayat penyakit dahulu:</Label>
                            <p className="mt-1">{selectedCase.past_medical_history || '-'}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Riwayat keluarga:</Label>
                            <p className="mt-1">{selectedCase.family_history || '-'}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Riwayat sosial:</Label>
                            <p className="mt-1">{selectedCase.social_history || '-'}</p>
                          </div>
                        </TabsContent>

                        <TabsContent value="pemeriksaan" className="space-y-4">
                          <div className="section-title font-semibold text-sm">Status Generalis</div>
                          <div>
                            <Label className="font-semibold">Kesan umum:</Label>
                            <p className="mt-1">{selectedCase.physical_exam.general || '-'}</p>
                          </div>
                          {selectedCase.physical_exam.vital_signs && (
                            <div>
                              <Label className="font-semibold">Tanda vital:</Label>
                              <ul className="mt-1 space-y-1 list-none">
                                <li>TD: {selectedCase.physical_exam.vital_signs.bp_mmHg || '-'} mmHg</li>
                                <li>Nadi: {selectedCase.physical_exam.vital_signs.hr_bpm || '-'} x/menit</li>
                                <li>RR: {selectedCase.physical_exam.vital_signs.rr_per_min || '-'} x/menit</li>
                                <li>Suhu: {selectedCase.physical_exam.vital_signs.temp_c || '-'} °C</li>
                                <li>SpO₂: {selectedCase.physical_exam.vital_signs.spo2_percent || '-'}%</li>
                              </ul>
                            </div>
                          )}
                          <div className="section-title font-semibold text-sm mt-4">Pemeriksaan Sistemik</div>
                          <ul className="space-y-1 list-none">
                            <li><strong>Respirasi:</strong> {selectedCase.physical_exam.systemic?.respiratory || '-'}</li>
                            <li><strong>Kardiovaskular:</strong> {selectedCase.physical_exam.systemic?.cardiovascular || '-'}</li>
                            <li><strong>Abdomen:</strong> {selectedCase.physical_exam.systemic?.abdomen || '-'}</li>
                            <li><strong>Neurologis:</strong> {selectedCase.physical_exam.systemic?.neuro || '-'}</li>
                            <li><strong>Ekstremitas:</strong> {selectedCase.physical_exam.systemic?.extremities || '-'}</li>
                          </ul>
                          {selectedCase.physical_exam.obstetric_exam && (
                            <>
                              <div className="section-title font-semibold text-sm mt-4">Pemeriksaan Obstetri</div>
                              <ul className="space-y-1 list-none">
                                <li><strong>TFU:</strong> {selectedCase.physical_exam.obstetric_exam.tfu_cm || '-'} cm</li>
                                <li><strong>DJJ:</strong> {selectedCase.physical_exam.obstetric_exam.fetal_heart_rate_bpm || '-'} x/menit</li>
                                <li><strong>Presentasi:</strong> {selectedCase.physical_exam.obstetric_exam.presentation || '-'}</li>
                                <li><strong>Edema:</strong> {selectedCase.physical_exam.obstetric_exam.edema || '-'}</li>
                              </ul>
                            </>
                          )}
                        </TabsContent>

                        <TabsContent value="lab" className="space-y-4">
                          <div className="section-title font-semibold text-sm">Pemeriksaan Laboratorium</div>
                          {selectedCase.laboratory && Object.keys(selectedCase.laboratory).length > 0 ? (
                            <ul className="space-y-1 list-none">
                              {Object.entries(selectedCase.laboratory)
                                .filter(([key]) => key !== 'catatan')
                                .map(([key, value]) => (
                                  <li key={key}>
                                    <strong>{key}</strong>: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <p>Tidak ada data lab.</p>
                          )}
                          {selectedCase.laboratory?.catatan && (
                            <div>
                              <Label className="font-semibold">Catatan:</Label>
                              <p className="mt-1">{String(selectedCase.laboratory.catatan)}</p>
                            </div>
                          )}
                          <hr className="my-2" />
                          <div className="section-title font-semibold text-sm">Pemeriksaan Penunjang / Imaging</div>
                          {selectedCase.imaging && Object.keys(selectedCase.imaging).length > 0 ? (
                            <ul className="space-y-1 list-none">
                              {Object.entries(selectedCase.imaging).map(([key, value]) => (
                                <li key={key}>
                                  <strong>{key}</strong>: {value}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>Tidak ada data penunjang.</p>
                          )}
                        </TabsContent>

                        <TabsContent value="diagnosis" className="space-y-4">
                          <div className="section-title font-semibold text-sm">Diagnosis</div>
                          <div>
                            <Label className="font-semibold">Diagnosis kerja:</Label>
                            <p className="mt-1">{selectedCase.working_diagnosis}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Diagnosa banding:</Label>
                            {selectedCase.differential_diagnoses && selectedCase.differential_diagnoses.length > 0 ? (
                              <ul className="mt-1 list-disc list-inside">
                                {selectedCase.differential_diagnoses.map((dd, idx) => (
                                  <li key={idx}>{dd}</li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="mt-1 list-disc list-inside"><li>-</li></ul>
                            )}
                          </div>
                          <hr className="my-2" />
                          <div className="section-title font-semibold text-sm">Rencana Tata Laksana</div>
                          <div>
                            <Label className="font-semibold">Non-farmakologis:</Label>
                            {selectedCase.management_plan?.non_pharmacological && selectedCase.management_plan.non_pharmacological.length > 0 ? (
                              <ul className="mt-1 list-disc list-inside">
                                {selectedCase.management_plan.non_pharmacological.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="mt-1 list-disc list-inside"><li>-</li></ul>
                            )}
                          </div>
                          <div>
                            <Label className="font-semibold">Farmakologis:</Label>
                            {selectedCase.management_plan?.pharmacological && selectedCase.management_plan.pharmacological.length > 0 ? (
                              <ul className="mt-1 list-disc list-inside">
                                {selectedCase.management_plan.pharmacological.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="mt-1 list-disc list-inside"><li>-</li></ul>
                            )}
                          </div>
                          <div>
                            <Label className="font-semibold">Prosedur:</Label>
                            {selectedCase.management_plan?.procedure ? (
                              <ul className="mt-1 list-disc list-inside">
                                <li>{selectedCase.management_plan.procedure}</li>
                              </ul>
                            ) : (
                              <ul className="mt-1 list-disc list-inside"><li>-</li></ul>
                            )}
                          </div>
                          <div>
                            <Label className="font-semibold">Monitoring:</Label>
                            <p className="mt-1">{selectedCase.management_plan?.monitoring || '-'}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Rujukan:</Label>
                            <p className="mt-1">{selectedCase.management_plan?.referral || '-'}</p>
                          </div>
                          <hr className="my-2" />
                          <div className="section-title font-semibold text-sm">Red Flags</div>
                          {selectedCase.red_flags && selectedCase.red_flags.length > 0 ? (
                            <ul className="mt-1 list-disc list-inside text-red-600">
                              {selectedCase.red_flags.map((flag, idx) => (
                                <li key={idx}>{flag}</li>
                              ))}
                            </ul>
                          ) : (
                            <ul className="mt-1 list-disc list-inside"><li>-</li></ul>
                          )}
                          <div className="section-title font-semibold text-sm mt-4">Learning Points</div>
                          {selectedCase.learning_points && selectedCase.learning_points.length > 0 ? (
                            <ul className="mt-1 list-disc list-inside">
                              {selectedCase.learning_points.map((point, idx) => (
                                <li key={idx}>{point}</li>
                              ))}
                            </ul>
                          ) : (
                            <ul className="mt-1 list-disc list-inside"><li>-</li></ul>
                          )}
                        </TabsContent>

                        <TabsContent value="refleksi" className="space-y-4">
                          <div className="section-title font-semibold text-sm">Refleksi Mahasiswa</div>
                          <div className="text-sm text-slate-600 mb-4">
                            Gunakan kerangka <strong>What – So What – Now What</strong> untuk merefleksikan kasus ini.
                          </div>
                          <div>
                            <Label htmlFor="what" className="font-medium">1. What? (Apa yang terjadi pada kasus ini?)</Label>
                            <Textarea
                              id="what"
                              placeholder="Ringkas temuan penting, keputusan yang Anda buat, dan hal yang menurut Anda menantang."
                              value={reflection.what}
                              onChange={(e) =>
                                setReflection({ ...reflection, what: e.target.value })
                              }
                              className="mt-2"
                              rows={4}
                            />
                          </div>
                          <div>
                            <Label htmlFor="so_what" className="font-medium">2. So what? (Apa maknanya bagi Anda sebagai calon dokter?)</Label>
                            <Textarea
                              id="so_what"
                              placeholder="Apa yang Anda pelajari? Bagaimana kasus ini mengubah cara Anda memandang diagnosis atau tata laksana?"
                              value={reflection.so_what}
                              onChange={(e) =>
                                setReflection({ ...reflection, so_what: e.target.value })
                              }
                              className="mt-2"
                              rows={4}
                            />
                          </div>
                          <div>
                            <Label htmlFor="now_what" className="font-medium">3. Now what? (Apa rencana Anda ke depan?)</Label>
                            <Textarea
                              id="now_what"
                              placeholder="Apa yang akan Anda lakukan berbeda di kasus berikutnya? Apa yang masih perlu Anda pelajari?"
                              value={reflection.now_what}
                              onChange={(e) =>
                                setReflection({ ...reflection, now_what: e.target.value })
                              }
                              className="mt-2"
                              rows={4}
                            />
                          </div>
                          {studentProgress[selectedCase.case_id]?.reflection_last_saved && (
                            <p className="text-xs text-slate-500">
                              Refleksi terakhir disimpan: {new Date(
                                studentProgress[selectedCase.case_id].reflection_last_saved!
                              ).toLocaleString('id-ID')}
                            </p>
                          )}
                          <Button onClick={handleReflectionSave} className="w-full mt-2">
                            Simpan Refleksi
                          </Button>
                        </TabsContent>
                      </ScrollArea>
                    </Tabs>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                      Silakan klik salah satu kasus di sisi kiri untuk melihat detail rekam medis.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quiz Panel */}
              <Card className="w-full lg:w-96 xl:w-[28rem] h-auto lg:h-[calc(100vh-180px)] shrink-0">
                <CardHeader>
                  <CardTitle>Kuis Cepat</CardTitle>
                  <CardDescription>
                    {selectedCase
                      ? `Kasus: ${selectedCase.case_id} • Fokus: ${selectedCase.assessment_items?.key_diagnosis || selectedCase.working_diagnosis}`
                      : 'Pilih kasus terlebih dahulu untuk memulai kuis.'}
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
                        <div className="flex gap-2">
                          <Button
                            onClick={handleQuizSubmit}
                            className="flex-1"
                          >
                            Cek Jawaban
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedAnswers({});
                              setQuizSubmitted(false);
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            Reset
                          </Button>
                        </div>
                        {quizSubmitted && (
                          <div className="text-center p-2 bg-slate-50 rounded">
                            <p className="text-sm font-semibold">
                              Skor: {(
                                (Object.entries(selectedAnswers).filter(
                                  ([qId, ansIdx]) =>
                                    selectedCase.assessment_items?.possible_mcq_questions?.find(
                                      (q) => q.id === qId
                                    )?.answer_index === ansIdx
                                ).length /
                                  (selectedCase.assessment_items?.possible_mcq_questions?.length || 1)) *
                                100
                              ).toFixed(0)}%
                            </p>
                          </div>
                        )}
                        {selectedCase.assessment_items?.critical_actions && selectedCase.assessment_items.critical_actions.length > 0 && (
                          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 mt-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">
                              Aksi kritis (untuk refleksi)
                            </div>
                            <ul className="text-sm list-disc list-inside space-y-1">
                              {selectedCase.assessment_items.critical_actions.map((action, idx) => (
                                <li key={idx}>{action}</li>
                              ))}
                            </ul>
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
