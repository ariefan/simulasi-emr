import { Link, Navigate, createFileRoute, useNavigate } from '@tanstack/react-router';
import { FileText, Home, LogOut, Menu } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { CaseData } from '@/types/case';
import type {
  DifferentialDiagnosis,
  EvidenceReference,
  ProblemRepresentation,
  ReasoningScoreBreakdown,
} from '@/types/clinical-reasoning';
import { ProblemRepresentationComponent } from '@/components/clinical-reasoning/ProblemRepresentation';
import { DDxBuilder } from '@/components/clinical-reasoning/DDxBuilder';
import { DecisionJustification } from '@/components/clinical-reasoning/DecisionJustification';
import { ReasoningScore } from '@/components/clinical-reasoning/ReasoningScore';
import { LabResults } from '@/components/emr/LabResults';
import { PatientTimeline } from '@/components/emr/PatientTimeline';
import { SOAPNote } from '@/components/emr/SOAPNote';
import { TreatmentProgress } from '@/components/emr/TreatmentProgress';
import { VitalSignsChart } from '@/components/emr/VitalSignsChart';
import { useAuth } from '@/contexts/AuthContext';
import { useCalculateReasoningScore, useClinicalReasoning, useSaveClinicalReasoning } from '@/hooks/use-clinical-reasoning';
import { useDebouncedCallback } from '@/hooks/use-debounce';
import { useCases } from '@/hooks/use-cases';
import {
  useSaveReflection,
  useStartCaseAttempt,
  useStudentProgress,
  useSubmitQuiz,
} from '@/hooks/use-progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

type ReflectionState = { what: string; so_what: string; now_what: string };

export const Route = createFileRoute('/pembelajaran')({
  component: PembelajaranPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      caseId: (search.caseId as string) || undefined,
    };
  },
});

function PembelajaranPage() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const { caseId } = Route.useSearch();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [reflection, setReflection] = useState<ReflectionState>({
    what: '',
    so_what: '',
    now_what: '',
  });
  const [currentAttemptId, setCurrentAttemptId] = useState<number | null>(null);
  const [attemptStartTime, setAttemptStartTime] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'typing' | 'draft' | 'saving' | 'saved' | 'error'>('idle');
  const [clinicalReasoning, setClinicalReasoning] = useState<{
    problemRepresentation: ProblemRepresentation;
    differentialDiagnoses: Array<DifferentialDiagnosis>;
    decisionJustification: string;
    evidenceReferences: Array<EvidenceReference>;
  }>({
    problemRepresentation: {
      summary: '',
      demographics: '',
      chiefComplaint: '',
      timeline: '',
      context: '',
      acuity: '',
      severity: '',
      pattern: '',
    },
    differentialDiagnoses: [],
    decisionJustification: '',
    evidenceReferences: [],
  });
  const [reasoningScore, setReasoningScore] = useState<ReasoningScoreBreakdown | null>(null);

  // Fetch cases from database (to get specific case by ID)
  const { data: cases = [], isLoading: casesLoading } = useCases({});

  // Fetch student progress
  const { data: studentProgress = {} } = useStudentProgress(user?.id || 0);
  const selectedCaseProgress = selectedCase
    ? studentProgress[selectedCase.case_id]
    : undefined;
  const assessmentItems = selectedCase?.assessment_items;
  const mcqQuestions = assessmentItems?.possible_mcq_questions;
  const criticalActions = assessmentItems?.critical_actions;

  // Mutations
  const startAttemptMutation = useStartCaseAttempt();
  const submitQuizMutation = useSubmitQuiz();
  const saveReflectionMutation = useSaveReflection();
  const saveClinicalReasoningMutation = useSaveClinicalReasoning();
  const calculateScoreMutation = useCalculateReasoningScore();

  // Fetch clinical reasoning for current attempt
  const { data: existingReasoning } = useClinicalReasoning(currentAttemptId);

  const getDraftStorageKey = useCallback(
    (caseId: string) => {
      if (!user) return null;
      return `reflection-draft-${user.id}-${caseId}`;
    },
    [user?.id]
  );

  const persistDraftToLocalStorage = useCallback(
    (caseId: string, draft: ReflectionState) => {
      if (typeof window === 'undefined') return;
      const key = getDraftStorageKey(caseId);
      if (!key) return;
      window.localStorage.setItem(
        key,
        JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })
      );
    },
    [getDraftStorageKey]
  );

  const loadDraftFromLocalStorage = useCallback(
    (caseId: string): ReflectionState | null => {
      if (typeof window === 'undefined') return null;
      const key = getDraftStorageKey(caseId);
      if (!key) return null;
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return {
          what: parsed.what || '',
          so_what: parsed.so_what || '',
          now_what: parsed.now_what || '',
        };
      } catch (error) {
        console.error('Failed to load reflection draft', error);
        return null;
      }
    },
    [getDraftStorageKey]
  );

  const saveReflectionToServer = (
    caseId: string,
    draft: ReflectionState,
    options?: { notify?: boolean }
  ) => {
    if (!user) return;
    setSaveStatus('saving');
    saveReflectionMutation.mutate(
      {
        studentId: user.id,
        caseId,
        attemptId:
          selectedCase?.case_id === caseId && currentAttemptId
            ? currentAttemptId
            : undefined,
        what: draft.what,
        soWhat: draft.so_what,
        nowWhat: draft.now_what,
      },
      {
        onSuccess: () => {
          if (options?.notify) {
            toast.success('Reflection saved!');
          }
          persistDraftToLocalStorage(caseId, draft);
          setSaveStatus('saved');
        },
        onError: (error) => {
          console.error('Error saving reflection:', error);
          if (options?.notify) {
            toast.error('Failed to save reflection');
          }
          setSaveStatus('error');
        },
      }
    );
  };

  const debouncedLocalSave = useDebouncedCallback(
    (caseId: string | undefined, draft: ReflectionState) => {
      if (!caseId) return;
      persistDraftToLocalStorage(caseId, draft);
      setSaveStatus('draft');
    },
    2000
  );

  const debouncedRemoteSave = useDebouncedCallback(
    (caseId: string | undefined, draft: ReflectionState) => {
      if (!caseId || !user) return;
      saveReflectionToServer(caseId, draft, { notify: false });
    },
    30000
  );

  // Debounced save for Clinical Reasoning
  const debouncedReasoningSave = useDebouncedCallback(
    (caseId: string | undefined) => {
      if (!caseId || !user || !currentAttemptId) return;
      saveClinicalReasoningMutation.mutate({
        attemptId: currentAttemptId,
        studentId: user.id,
        caseId,
        ...clinicalReasoning,
      });
    },
    30000
  );

  // Auto-select case based on URL parameter
  useEffect(() => {
    if (cases.length === 0) {
      setSelectedCase(null);
      return;
    }
    if (caseId) {
      // Find case by ID from URL
      const caseFromUrl = cases.find((c) => c.case_id === caseId);
      if (caseFromUrl) {
        setSelectedCase(caseFromUrl);
      } else {
        // Case not found, redirect to case list
        navigate({ to: '/kasus' });
      }
    } else {
      // No case selected, redirect to case list
      navigate({ to: '/kasus' });
    }
  }, [cases, caseId, navigate]);

  // Load reflection for selected case and start attempt
  useEffect(() => {
    if (!selectedCase || !user) return;

    debouncedLocalSave.cancel();
    debouncedRemoteSave.cancel();

    if (selectedCaseProgress?.reflection) {
      const serverReflection: ReflectionState = {
        what: selectedCaseProgress.reflection.what || '',
        so_what: selectedCaseProgress.reflection.so_what || '',
        now_what: selectedCaseProgress.reflection.now_what || '',
      };
      setReflection(serverReflection);
      persistDraftToLocalStorage(selectedCase.case_id, serverReflection);
      setSaveStatus('saved');
    } else {
      const draft = loadDraftFromLocalStorage(selectedCase.case_id);
      if (draft) {
        setReflection(draft);
        setSaveStatus('draft');
      } else {
        setReflection({ what: '', so_what: '', now_what: '' });
        setSaveStatus('idle');
      }
    }

    setSelectedAnswers({});
    setQuizSubmitted(false);
    setCurrentAttemptId(null);
    setAttemptStartTime(null);

    // Start a new attempt for this case
    startAttemptMutation.mutate(
      { studentId: user.id, caseId: selectedCase.case_id },
      {
        onSuccess: (attempt) => {
          setCurrentAttemptId(attempt.id);
          const started = new Date(attempt.startedAt).getTime();
          setAttemptStartTime(started);
        },
      }
    );
  }, [
    selectedCase?.case_id,
    user?.id,
    selectedCaseProgress,
    debouncedLocalSave,
    debouncedRemoteSave,
    persistDraftToLocalStorage,
    loadDraftFromLocalStorage,
  ]);

  // Load Clinical Reasoning when data becomes available
  useEffect(() => {
    if (existingReasoning) {
      setClinicalReasoning({
        problemRepresentation: existingReasoning.problemRepresentation || {
          summary: '',
          demographics: '',
          chiefComplaint: '',
          timeline: '',
          context: '',
          acuity: '',
          severity: '',
          pattern: '',
        },
        differentialDiagnoses: existingReasoning.differentialDiagnoses || [],
        decisionJustification: existingReasoning.decisionJustification || '',
        evidenceReferences: existingReasoning.evidenceReferences || [],
      });
      setReasoningScore(existingReasoning.scoreBreakdown || null);
    } else {
      setClinicalReasoning({
        problemRepresentation: {
          summary: '',
          demographics: '',
          chiefComplaint: '',
          timeline: '',
          context: '',
          acuity: '',
          severity: '',
          pattern: '',
        },
        differentialDiagnoses: [],
        decisionJustification: '',
        evidenceReferences: [],
      });
      setReasoningScore(null);
    }
  }, [existingReasoning]);

  if (isLoading || casesLoading) {
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
    { icon: FileText, label: 'Daftar Kasus', href: '/kasus' },
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

  const saveStatusLabel = () => {
    switch (saveStatus) {
      case 'typing':
        return 'Sedang mengetik...';
      case 'draft':
        return 'Draft tersimpan lokal';
      case 'saving':
        return 'Menyimpan...';
      case 'saved':
        return 'Tersimpan';
      case 'error':
        return 'Gagal menyimpan';
      default:
        return 'Belum ada perubahan';
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    if (!quizSubmitted) {
      setSelectedAnswers({ ...selectedAnswers, [questionId]: answerIndex });
    }
  };

  const handleQuizSubmit = () => {
    if (!mcqQuestions || !currentAttemptId) return;
    let correct = 0;

    mcqQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.answer_index) {
        correct++;
      }
    });

    const score = (correct / mcqQuestions.length) * 100;
    const timeSpentSeconds = attemptStartTime
      ? Math.max(1, Math.round((Date.now() - attemptStartTime) / 1000))
      : undefined;

    // Submit quiz to server
    submitQuizMutation.mutate(
      {
        attemptId: currentAttemptId,
        studentId: user.id,
        caseId: selectedCase.case_id,
        answers: selectedAnswers,
        score,
        maxScore: mcqQuestions.length,
        timeSpentSeconds,
      },
      {
        onSuccess: () => {
          setQuizSubmitted(true);
          setAttemptStartTime(null);
          toast.success(`Quiz submitted! Score: ${score.toFixed(0)}%`);
        },
        onError: (error) => {
          console.error('Error submitting quiz:', error);
          toast.error('Failed to submit quiz');
        },
      }
    );
  };

  const handleReflectionChange = (field: keyof ReflectionState, value: string) => {
    setReflection((prev) => {
      const updated = { ...prev, [field]: value };
      if (selectedCase) {
        setSaveStatus('typing');
        debouncedLocalSave(selectedCase.case_id, updated);
        debouncedRemoteSave(selectedCase.case_id, updated);
      }
      return updated;
    });
  };

  const handleReflectionSave = () => {
    if (!selectedCase) return;
    debouncedRemoteSave.cancel();
    saveReflectionToServer(selectedCase.case_id, reflection, { notify: true });
  };

  const handleProblemRepChange = (data: ProblemRepresentation) => {
    setClinicalReasoning((prev) => {
      const updated = { ...prev, problemRepresentation: data };
      if (selectedCase) {
        debouncedReasoningSave(selectedCase.case_id);
      }
      return updated;
    });
  };

  const handleDDxChange = (data: Array<DifferentialDiagnosis>) => {
    setClinicalReasoning((prev) => {
      const updated = { ...prev, differentialDiagnoses: data };
      if (selectedCase) {
        debouncedReasoningSave(selectedCase.case_id);
      }
      return updated;
    });
  };

  const handleJustificationChange = (value: string) => {
    setClinicalReasoning((prev) => {
      const updated = { ...prev, decisionJustification: value };
      if (selectedCase) {
        debouncedReasoningSave(selectedCase.case_id);
      }
      return updated;
    });
  };

  const handleReferencesChange = (data: Array<EvidenceReference>) => {
    setClinicalReasoning((prev) => {
      const updated = { ...prev, evidenceReferences: data };
      if (selectedCase) {
        debouncedReasoningSave(selectedCase.case_id);
      }
      return updated;
    });
  };

  const handleCalculateScore = () => {
    if (!currentAttemptId) {
      toast.error('No active attempt');
      return;
    }
    calculateScoreMutation.mutate(
      { attemptId: currentAttemptId },
      {
        onSuccess: (score) => {
          setReasoningScore(score);
          toast.success('Skor berhasil dihitung!');
        },
        onError: (error) => {
          console.error('Error calculating score:', error);
          toast.error('Gagal menghitung skor');
        },
      }
    );
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
        <main className="flex-1 p-3 md:p-4 bg-slate-50">
          <div className="h-full flex flex-col lg:flex-row gap-3">
              {/* Case Details */}
              <Card className="flex-1 flex flex-col h-auto lg:h-[calc(100vh-140px)]">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold">
                    {selectedCase?.case_id || 'Pilih Kasus'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedCase?.skdi_diagnosis || 'Tidak ada kasus dipilih'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden p-3 pt-0">
                  {selectedCase ? (
                    <Tabs defaultValue="identitas" className="flex-1 flex flex-col">
                      <TabsList className="grid w-full grid-cols-4 md:grid-cols-8 gap-0.5 h-8">
                        <TabsTrigger value="identitas" className="text-[10px] md:text-xs py-1">Identitas</TabsTrigger>
                        <TabsTrigger value="anamnesis" className="text-[10px] md:text-xs py-1">Anamnesis</TabsTrigger>
                        <TabsTrigger value="pemeriksaan" className="text-[10px] md:text-xs py-1">Pemeriksaan Fisik</TabsTrigger>
                        <TabsTrigger value="lab" className="text-[10px] md:text-xs py-1">Lab & Penunjang</TabsTrigger>
                        <TabsTrigger value="emr" className="text-[10px] md:text-xs py-1">Workspace EMR</TabsTrigger>
                        <TabsTrigger value="diagnosis" className="text-[10px] md:text-xs py-1">Diagnosis & Plan</TabsTrigger>
                        <TabsTrigger value="clinical-reasoning" className="text-[10px] md:text-xs py-1">Clinical Reasoning</TabsTrigger>
                        <TabsTrigger value="refleksi" className="text-[10px] md:text-xs py-1">Refleksi</TabsTrigger>
                      </TabsList>

                      <ScrollArea className="flex-1 mt-2">
                        <TabsContent value="identitas" className="space-y-2 pr-3">
                          <div className="section-title font-semibold text-xs">Identitas Pasien</div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                            <div>
                              <Label className="font-semibold text-xs">Nama:</Label>
                              <p className="text-xs">{selectedCase.patient.name}</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-xs">Umur:</Label>
                              <p className="text-xs">{selectedCase.patient.age} tahun</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-xs">Jenis kelamin:</Label>
                              <p className="text-xs">{selectedCase.patient.sex === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-xs">Status perkawinan:</Label>
                              <p className="text-xs">{selectedCase.patient.marital_status || '-'}</p>
                            </div>
                            {selectedCase.patient.gravida !== null && (
                              <div>
                                <Label className="font-semibold text-xs">Gravida:</Label>
                                <p className="text-xs">{selectedCase.patient.gravida}</p>
                              </div>
                            )}
                            {selectedCase.patient.para !== null && (
                              <div>
                                <Label className="font-semibold text-xs">Para:</Label>
                                <p className="text-xs">{selectedCase.patient.para}</p>
                              </div>
                            )}
                            <div>
                              <Label className="font-semibold text-xs">Konteks:</Label>
                              <p className="text-xs">{selectedCase.patient.address_type || '-'}</p>
                            </div>
                            <div>
                              <Label className="font-semibold text-xs">Jaminan:</Label>
                              <p className="text-xs">{selectedCase.patient.insurance_status || '-'}</p>
                            </div>
                          </div>
                          <hr className="my-1.5" />
                          <div className="section-title font-semibold text-xs">Ringkasan Kasus</div>
                          <div>
                            <Label className="font-semibold text-xs">Keluhan utama:</Label>
                            <p className="text-xs mt-0.5">{selectedCase.chief_complaint}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-xs">Diagnosis kerja:</Label>
                            <p className="text-xs mt-0.5">{selectedCase.working_diagnosis}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-xs">ICD-10:</Label>
                            <p className="text-xs mt-0.5">{selectedCase.icd10}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-xs">Level SKDI:</Label>
                            <p className="text-xs mt-0.5">{selectedCase.skdi_level}</p>
                          </div>
                        </TabsContent>

                        <TabsContent value="anamnesis" className="space-y-2 pr-3">
                          <div className="section-title font-semibold text-xs">Anamnesis</div>
                          <div>
                            <Label className="font-semibold text-xs">Keluhan utama:</Label>
                            <p className="text-xs mt-0.5">{selectedCase.chief_complaint}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-xs">Riwayat penyakit sekarang:</Label>
                            <p className="text-xs mt-0.5 whitespace-pre-wrap">
                              {selectedCase.history_of_present_illness}
                            </p>
                          </div>
                          <div>
                            <Label className="font-semibold text-xs">Riwayat penyakit dahulu:</Label>
                            <p className="text-xs mt-0.5">{selectedCase.past_medical_history || '-'}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-xs">Riwayat keluarga:</Label>
                            <p className="text-xs mt-0.5">{selectedCase.family_history || '-'}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-xs">Riwayat sosial:</Label>
                            <p className="text-xs mt-0.5">{selectedCase.social_history || '-'}</p>
                          </div>
                        </TabsContent>

                        <TabsContent value="pemeriksaan" className="space-y-2 pr-3">
                          <div className="section-title font-semibold text-xs">Status Generalis</div>
                          <div>
                            <Label className="font-semibold text-xs">Kesan umum:</Label>
                            <p className="text-xs mt-0.5">{selectedCase.physical_exam.general || '-'}</p>
                          </div>
                          {selectedCase.physical_exam.vital_signs && (
                            <div>
                              <Label className="font-semibold text-xs">Tanda vital:</Label>
                              <ul className="mt-0.5 space-y-0.5 list-none text-xs">
                                <li>TD: {selectedCase.physical_exam.vital_signs.bp_mmHg || '-'} mmHg</li>
                                <li>Nadi: {selectedCase.physical_exam.vital_signs.hr_bpm || '-'} x/menit</li>
                                <li>RR: {selectedCase.physical_exam.vital_signs.rr_per_min || '-'} x/menit</li>
                                <li>Suhu: {selectedCase.physical_exam.vital_signs.temp_c || '-'} °C</li>
                                <li>SpO₂: {selectedCase.physical_exam.vital_signs.spo2_percent || '-'}%</li>
                              </ul>
                            </div>
                          )}
                          <div className="section-title font-semibold text-xs mt-2">Pemeriksaan Sistemik</div>
                          <ul className="space-y-0.5 list-none text-xs">
                            <li><strong>Respirasi:</strong> {selectedCase.physical_exam.systemic?.respiratory || '-'}</li>
                            <li><strong>Kardiovaskular:</strong> {selectedCase.physical_exam.systemic?.cardiovascular || '-'}</li>
                            <li><strong>Abdomen:</strong> {selectedCase.physical_exam.systemic?.abdomen || '-'}</li>
                            <li><strong>Neurologis:</strong> {selectedCase.physical_exam.systemic?.neuro || '-'}</li>
                            <li><strong>Ekstremitas:</strong> {selectedCase.physical_exam.systemic?.extremities || '-'}</li>
                          </ul>
                          {selectedCase.physical_exam.obstetric_exam && (
                            <>
                              <div className="section-title font-semibold text-xs mt-2">Pemeriksaan Obstetri</div>
                              <ul className="space-y-0.5 list-none text-xs">
                                <li><strong>TFU:</strong> {selectedCase.physical_exam.obstetric_exam.tfu_cm || '-'} cm</li>
                                <li><strong>DJJ:</strong> {selectedCase.physical_exam.obstetric_exam.fetal_heart_rate_bpm || '-'} x/menit</li>
                                <li><strong>Presentasi:</strong> {selectedCase.physical_exam.obstetric_exam.presentation || '-'}</li>
                                <li><strong>Edema:</strong> {selectedCase.physical_exam.obstetric_exam.edema || '-'}</li>
                              </ul>
                            </>
                          )}
                        </TabsContent>

                        <TabsContent value="lab" className="space-y-2 pr-3">
                          <LabResults labData={selectedCase.laboratory} imaging={selectedCase.imaging} />
                        </TabsContent>

                        <TabsContent value="emr" className="space-y-3 pr-3">
                              <PatientTimeline caseData={selectedCase} />
                              <div className="grid gap-3 md:grid-cols-2">
                                <VitalSignsChart vitalSigns={selectedCase.physical_exam.vital_signs} />
                                <TreatmentProgress caseId={selectedCase.case_id} plan={selectedCase.management_plan} />
                              </div>
                              <SOAPNote caseData={selectedCase} />
                        </TabsContent>

                        <TabsContent value="diagnosis" className="space-y-2 pr-3">
                          <div className="section-title font-semibold text-xs">Diagnosis</div>
                          <div>
                            <Label className="font-semibold text-xs">Diagnosis kerja:</Label>
                            <p className="text-xs mt-0.5">{selectedCase.working_diagnosis}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-xs">Diagnosa banding:</Label>
                            {selectedCase.differential_diagnoses && selectedCase.differential_diagnoses.length > 0 ? (
                              <ul className="mt-0.5 list-disc list-inside text-xs">
                                {selectedCase.differential_diagnoses.map((dd, idx) => (
                                  <li key={idx}>{dd}</li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="mt-0.5 list-disc list-inside text-xs"><li>-</li></ul>
                            )}
                          </div>
                          <hr className="my-1.5" />
                          <div className="section-title font-semibold text-xs">Rencana Tata Laksana</div>
                          <div>
                            <Label className="font-semibold text-xs">Non-farmakologis:</Label>
                            {selectedCase.management_plan?.non_pharmacological && selectedCase.management_plan.non_pharmacological.length > 0 ? (
                              <ul className="mt-0.5 list-disc list-inside text-xs">
                                {selectedCase.management_plan.non_pharmacological.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="mt-0.5 list-disc list-inside text-xs"><li>-</li></ul>
                            )}
                          </div>
                          <div>
                            <Label className="font-semibold text-xs">Farmakologis:</Label>
                            {selectedCase.management_plan?.pharmacological && selectedCase.management_plan.pharmacological.length > 0 ? (
                              <ul className="mt-0.5 list-disc list-inside text-xs">
                                {selectedCase.management_plan.pharmacological.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="mt-0.5 list-disc list-inside text-xs"><li>-</li></ul>
                            )}
                          </div>
                          <div>
                            <Label className="font-semibold text-xs">Prosedur:</Label>
                            {selectedCase.management_plan?.procedure ? (
                              <ul className="mt-0.5 list-disc list-inside text-xs">
                                <li>{selectedCase.management_plan.procedure}</li>
                              </ul>
                            ) : (
                              <ul className="mt-0.5 list-disc list-inside text-xs"><li>-</li></ul>
                            )}
                          </div>
                          <div>
                            <Label className="font-semibold text-xs">Monitoring:</Label>
                            <p className="text-xs mt-0.5">{selectedCase.management_plan?.monitoring || '-'}</p>
                          </div>
                          <div>
                            <Label className="font-semibold text-xs">Rujukan:</Label>
                            <p className="text-xs mt-0.5">{selectedCase.management_plan?.referral || '-'}</p>
                          </div>
                          <hr className="my-1.5" />
                          <div className="section-title font-semibold text-xs">Red Flags</div>
                          {selectedCase.red_flags && selectedCase.red_flags.length > 0 ? (
                            <ul className="mt-0.5 list-disc list-inside text-xs text-red-600">
                              {selectedCase.red_flags.map((flag, idx) => (
                                <li key={idx}>{flag}</li>
                              ))}
                            </ul>
                          ) : (
                            <ul className="mt-0.5 list-disc list-inside text-xs"><li>-</li></ul>
                          )}
                          <div className="section-title font-semibold text-xs mt-2">Learning Points</div>
                          {selectedCase.learning_points && selectedCase.learning_points.length > 0 ? (
                            <ul className="mt-0.5 list-disc list-inside text-xs">
                              {selectedCase.learning_points.map((point, idx) => (
                                <li key={idx}>{point}</li>
                              ))}
                            </ul>
                          ) : (
                            <ul className="mt-0.5 list-disc list-inside text-xs"><li>-</li></ul>
                          )}
                        </TabsContent>

                        <TabsContent value="clinical-reasoning" className="space-y-4 pr-3">
                          <div className="section-title font-semibold text-xs">Clinical Reasoning Workspace</div>
                          <div className="text-xs text-slate-600">
                            Gunakan workspace ini untuk melatih kemampuan <strong>Clinical Reasoning</strong> Anda.
                            Lengkapi setiap bagian untuk mendapatkan penilaian otomatis.
                          </div>

                          {/* Problem Representation */}
                          <div className="border-t pt-3">
                            <h4 className="font-semibold text-sm mb-3">1. Problem Representation</h4>
                            <ProblemRepresentationComponent
                              data={clinicalReasoning.problemRepresentation}
                              onChange={handleProblemRepChange}
                            />
                          </div>

                          {/* Differential Diagnoses */}
                          <div className="border-t pt-3">
                            <h4 className="font-semibold text-sm mb-3">2. Differential Diagnosis (DDx)</h4>
                            <DDxBuilder
                              differentials={clinicalReasoning.differentialDiagnoses}
                              onChange={handleDDxChange}
                            />
                          </div>

                          {/* Decision Justification */}
                          <div className="border-t pt-3">
                            <h4 className="font-semibold text-sm mb-3">3. Justifikasi Keputusan</h4>
                            <DecisionJustification
                              justification={clinicalReasoning.decisionJustification}
                              references={clinicalReasoning.evidenceReferences}
                              onJustificationChange={handleJustificationChange}
                              onReferencesChange={handleReferencesChange}
                            />
                          </div>

                          {/* Reasoning Score */}
                          <div className="border-t pt-3">
                            <h4 className="font-semibold text-sm mb-3">4. Penilaian Clinical Reasoning</h4>
                            <ReasoningScore
                              score={reasoningScore}
                              onCalculate={handleCalculateScore}
                              isCalculating={calculateScoreMutation.isPending}
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="refleksi" className="space-y-2 pr-3">
                          <div className="section-title font-semibold text-xs">Refleksi Mahasiswa</div>
                          <div className="text-xs text-slate-600">
                            Gunakan kerangka <strong>What – So What – Now What</strong> untuk merefleksikan kasus ini.
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Status penyimpanan: {saveStatusLabel()}</span>
                            {selectedCaseProgress?.reflection_last_saved && (
                              <span>
                                Terakhir simpan:{' '}
                                {new Date(
                                  selectedCaseProgress.reflection_last_saved
                                ).toLocaleTimeString('id-ID')}
                              </span>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="what" className="font-medium text-xs">1. What? (Apa yang terjadi pada kasus ini?)</Label>
                            <Textarea
                              id="what"
                              placeholder="Ringkas temuan penting, keputusan yang Anda buat, dan hal yang menurut Anda menantang."
                              value={reflection.what}
                              onChange={(e) =>
                                handleReflectionChange('what', e.target.value)
                              }
                              className="mt-1 text-xs"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="so_what" className="font-medium text-xs">2. So what? (Apa maknanya bagi Anda sebagai calon dokter?)</Label>
                            <Textarea
                              id="so_what"
                              placeholder="Apa yang Anda pelajari? Bagaimana kasus ini mengubah cara Anda memandang diagnosis atau tata laksana?"
                              value={reflection.so_what}
                              onChange={(e) =>
                                handleReflectionChange('so_what', e.target.value)
                              }
                              className="mt-1 text-xs"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="now_what" className="font-medium text-xs">3. Now what? (Apa rencana Anda ke depan?)</Label>
                            <Textarea
                              id="now_what"
                              placeholder="Apa yang akan Anda lakukan berbeda di kasus berikutnya? Apa yang masih perlu Anda pelajari?"
                              value={reflection.now_what}
                              onChange={(e) =>
                                handleReflectionChange('now_what', e.target.value)
                              }
                              className="mt-1 text-xs"
                              rows={3}
                            />
                          </div>
                          <Button onClick={handleReflectionSave} className="w-full h-8 text-xs">
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
              <Card className="hidden lg:flex flex-col flex-1 min-w-60 max-w-[280px] h-[calc(100vh-140px)]">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-semibold">Kuis Cepat</CardTitle>
                  <CardDescription className="text-[10px] leading-tight mt-0.5">
                    {selectedCase
                      ? `Kasus: ${selectedCase.case_id} • Fokus: ${selectedCase.assessment_items?.key_diagnosis || selectedCase.working_diagnosis}`
                      : 'Pilih kasus terlebih dahulu untuk memulai kuis.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col overflow-hidden p-3 pt-0">
                  {mcqQuestions ? (
                    <div className="space-y-2 flex flex-col flex-1 overflow-hidden">
                      <ScrollArea className="flex-1">
                        <div className="space-y-3 pr-3">
                          {mcqQuestions.map((q, idx) => (
                            <div key={q.id} className="space-y-1.5">
                              <p className="font-medium text-xs leading-tight">
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
                                      className={`w-full text-left p-1.5 text-xs rounded border transition-colors ${showCorrect
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

                      <div className="space-y-2 pt-2 border-t shrink-0">
                        <div className="flex gap-1.5">
                          <Button
                            onClick={handleQuizSubmit}
                            className="flex-1 h-8 text-xs"
                          >
                            Cek Jawaban
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedAnswers({});
                              setQuizSubmitted(false);
                            }}
                            variant="outline"
                            className="flex-1 h-8 text-xs"
                          >
                            Reset
                          </Button>
                        </div>
                        {quizSubmitted && (
                          <div className="text-center p-1.5 bg-slate-50 rounded">
                            <p className="text-xs font-semibold">
                              Skor: {(
                                (Object.entries(selectedAnswers).filter(
                                  ([qId, ansIdx]) =>
                                    mcqQuestions.find((q) => q.id === qId)?.answer_index === ansIdx
                                ).length /
                                  (mcqQuestions.length || 1)) *
                                100
                              ).toFixed(0)}%
                            </p>
                          </div>
                        )}
                        {criticalActions && criticalActions.length > 0 && (
                          <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-600 mb-1.5">
                              Aksi kritis (untuk refleksi)
                            </div>
                            <ul className="text-xs list-disc list-inside space-y-0.5">
                              {criticalActions.map((action, idx) => (
                                <li key={idx} className="leading-tight">{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                      Tidak ada soal untuk kasus ini
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
