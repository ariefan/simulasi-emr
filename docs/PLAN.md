# 🎯 Master Plan - Sistem Simulator RME Koas

## 📋 Executive Summary

Sistem ini dirancang untuk melatih **Clinical Reasoning** mahasiswa koas melalui **simulasi kasus medis** berbasis EMR dengan pendekatan **adaptive learning** dan **gamification**.

### Tujuan Utama:
1. ✅ **Clinical Reasoning** - Meningkatkan kemampuan penalaran klinis
2. ✅ **Kompetensi SKDI** - Memenuhi standar kompetensi dokter Indonesia
3. ✅ **Adaptive Learning** - Pembelajaran yang menyesuaikan dengan kemampuan
4. ✅ **Dokumentasi EMR** - Melatih dokumentasi rekam medis elektronik

---

## 🏗️ Arsitektur Sistem (Berdasarkan Diagram)

```
┌─────────────────────────────────────────────────┐
│    Tujuan: Clinical Reasoning + SKDI +          │
│    Adaptive Learning + Dokumentasi EMR          │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────▼──────────┐
         │  Kompetensi SKDI   │
         │    Level 1-4       │
         └─────────┬──────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼───┐    ┌────▼────┐    ┌───▼────┐
│  RME  │    │Clinical │    │ Gamifi-│
│Module │    │Reasoning│    │ cation │
└───┬───┘    └────┬────┘    └───┬────┘
    │             │              │
    └─────────────┼──────────────┘
                  │
         ┌────────▼─────────┐
         │  Assessment &    │
         │   Analytics      │
         └──────────────────┘
```

---

## 🎯 Sprint Breakdown Detail

### ✅ **Sprint 1 - Foundation** (COMPLETED)
**Target:** Setup sistem dasar dengan database dan fitur core

#### Completed:
- ✅ Database PostgreSQL (Neon)
- ✅ Drizzle ORM setup
- ✅ 4 tabel: users, cases, student_case_attempts, quiz_submissions, student_reflections
- ✅ Import 10 kasus sintetis
- ✅ Login/Auth system
- ✅ Dashboard dengan statistik real-time
- ✅ Pembelajaran page dengan quiz MCQ
- ✅ Refleksi (What/So What/Now What)
- ✅ Progress tracking dasar
- ✅ Bahasa Indonesia UI

#### Deliverables:
- Database schema yang solid
- 10 synthetic cases di database
- User dapat login, browse kasus, jawab quiz, tulis refleksi
- Dashboard menampilkan statistik: Total Percobaan, Kasus Selesai, Nilai Rata-rata, Total Refleksi

---

### ✅ **Sprint 2 - Core Features Enhancement** (COMPLETED)
**Target:** Improve existing features dan tambah fitur essential

#### Planned Tasks:

##### 1. Time Tracking (Priority: 🔴 HIGH) ✅ COMPLETED
**File:** `src/lib/progress-actions.ts`, `src/hooks/use-progress.ts`

```typescript
// TODO: Add to startCaseAttempt
- Record startedAt timestamp
- Calculate timeSpentSeconds on quiz submit
- Display time statistics on dashboard

// Database field sudah ada:
- timeSpentSeconds in student_case_attempts table
```

**Implementation Steps:**
1. Modify `startCaseAttempt` to store start time in state ✅
2. Calculate duration when quiz submitted ✅
3. Update `submitQuiz` to include timeSpentSeconds ✅
4. Add time statistics to dashboard ✅
   - Average time per case
   - Total study time
   - Time spent today

##### 2. Reflection Auto-Save (Priority: 🔴 HIGH) ✅ COMPLETED
**File:** `src/routes/pembelajaran.tsx`

```typescript
// TODO: Implement debounced auto-save
- Use useEffect with debounce (2-3 seconds)
- Save reflection draft to localStorage first
- Then save to database
- Show "Saving..." / "Saved" indicator

// Libraries needed:
- lodash.debounce or custom debounce hook
```

**Implementation Steps:**
1. Create `useDebounce` hook ✅
2. Auto-save to localStorage every 2s ✅
3. Sync to database every 30s ✅
4. Add visual indicator (Saving.../Tersimpan) ✅
5. Restore draft on page reload ✅

##### 3. SKDI Level Filter (Priority: 🟡 MEDIUM) ✅ COMPLETED
**File:** `src/routes/pembelajaran.tsx`

```typescript
// TODO: Add SKDI level filter dropdown
- Filter cases by SKDI level (1, 2, 3, 4)
- Show badge on each case card
- Update useCases hook to accept skdiLevel filter
```

**Implementation Steps:**
1. Add SKDI level dropdown ✅
2. Update `getCases` server function ✅
3. Add visual SKDI badge on case cards ✅
4. Color code by level (1=green, 2=yellow, 3=orange, 4=red) ✅

---

#### Sprint 2 Deliverables ✅:
All planned features have been completed and verified:
- ✅ Time Tracking (end-to-end: client timer → server storage → dashboard display)
- ✅ Reflection Auto-save (dual-layer: localStorage + database with status indicators)
- ✅ SKDI Level Filter (server-side filtering + color-coded badges)
- 🔄 Progress Visualization (moved to future sprint)

**Verification:** See `docs/FEATURES.md` for detailed implementation references.

---

### ✅ **Sprint 3 - Clinical Reasoning Workspace** (COMPLETED)
**Target:** Implement core clinical reasoning features

#### Features Implemented:

##### 1. Problem Representation Builder
**New Component:** `src/components/clinical-reasoning/ProblemRepresentation.tsx`

```typescript
interface ProblemRepresentation {
  // One-liner summary
  summary: string;

  // Key features
  demographics: string; // "55yo M"
  chiefComplaint: string; // "chest pain"
  timeline: string; // "acute onset 2h ago"
  context: string; // "at rest, no exertion"

  // Semantic qualifiers
  acuity: 'acute' | 'subacute' | 'chronic';
  severity: 'mild' | 'moderate' | 'severe';
  pattern: string; // "intermittent vs constant"
}
```

**UI Design:**
- Textarea untuk one-liner summary
- Structured input fields
- Auto-suggestion dari case data
- Template library

##### 2. Differential Diagnosis (DDx) Builder
**New Component:** `src/components/clinical-reasoning/DdxBuilder.tsx`

```typescript
interface DifferentialDiagnosis {
  diagnosis: string;
  likelihood: 'very likely' | 'likely' | 'possible' | 'unlikely';
  supportingEvidence: string[];
  againstEvidence: string[];
  nextSteps: string[]; // investigations needed
}
```

**Features:**
- Drag & drop untuk ranking
- Add/remove diagnosis
- Evidence input (pro/con)
- Visual likelihood meter
- Comparison with expert DDx

##### 3. Justifikasi Keputusan
**New Component:** `src/components/clinical-reasoning/DecisionJustification.tsx`

```typescript
interface ClinicalDecision {
  decision: string; // e.g., "Order cardiac markers"
  rationale: string; // Why this decision
  alternatives: string[]; // What else considered
  references: string[]; // Evidence-based sources
  confidence: number; // 1-5 stars
}
```

**Features:**
- Rich text editor (TipTap/Quill)
- Reference manager
- Confidence slider
- Link to clinical guidelines

##### 4. Reasoning Summary & Scoring
**New Component:** `src/components/clinical-reasoning/ReasoningSummary.tsx`

**Scoring Rubric:**
```typescript
interface ReasoningScore {
  problemRepresentation: number; // /10
  differentialDiagnosis: number; // /10
  evidenceQuality: number; // /10
  decisionRationale: number; // /10
  total: number; // /40

  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  }
}
```

**Auto-grading Criteria:**
- Completeness
- Accuracy (compare with expert)
- Evidence quality
- Logical flow

---

#### Sprint 3 Deliverables ✅:
All planned features have been completed and verified:
- ✅ **Problem Representation** - Full interface with demographics, timeline, context, semantic qualifiers (acuity, severity, pattern)
- ✅ **DDx Builder** - Complete differential diagnosis manager with ranking, likelihood assessment, supporting/against evidence
- ✅ **Decision Justification** - Rich text editor with evidence-based reference management system
- ✅ **Clinical Reasoning Scoring** - Automated scoring algorithm (100pts each: Problem Rep, DDx, Justification) with feedback
- ✅ **Database Integration** - JSONB storage in clinicalReasoning table with auto-save (30s debounce)
- ✅ **Server Actions** - saveClinicalReasoning, getClinicalReasoning, calculateReasoningScore
- ✅ **Custom Hook** - use-clinical-reasoning.ts for mutations and queries
- ✅ **UI Integration** - "Clinical Reasoning" tab in pembelajaran.tsx with all components

**Components Created:**
- `src/components/clinical-reasoning/ProblemRepresentation.tsx` (120 lines)
- `src/components/clinical-reasoning/DDxBuilder.tsx` (327 lines)
- `src/components/clinical-reasoning/DecisionJustification.tsx` (107 lines)
- `src/components/clinical-reasoning/ReasoningScore.tsx` (144 lines)
- `src/types/clinical-reasoning.ts` (42 lines)
- `src/hooks/use-clinical-reasoning.ts` (48 lines)
- `src/lib/clinical-reasoning-actions.ts` (197 lines)

**Database Schema:**
- `clinicalReasoning` table with JSONB fields for complex data structures
- Foreign keys to studentCaseAttempts, users, and cases tables
- Auto-tracking with createdAt/updatedAt timestamps

**Verification:** See `docs/FEATURES.md` Sprint 3 Verification section for detailed code references.

**Known Issues Fixed:**
- React hooks order error (moved debouncedReasoningSave before useEffect)

**Future UX Improvement Noted:**
- Current implementation uses tab-based UI (Tab #6)
- Consider side panel or persistent drawer for better pedagogical workflow
- Allows students to reference case data while building clinical reasoning
- Planned for future sprint (Sprint 4 or later)

---

### 📋 **Sprint 4 - EMR Module**
**Target:** Build educational EMR interface

#### Features:

##### 1. Patient Timeline
**New Component:** `src/components/emr/PatientTimeline.tsx`

```typescript
interface TimelineEvent {
  timestamp: Date;
  eventType: 'vital' | 'lab' | 'medication' | 'procedure' | 'note';
  description: string;
  data: any;
  severity?: 'normal' | 'warning' | 'critical';
}
```

**UI:**
- Vertical timeline
- Filter by event type
- Hover for details
- Color-coded by severity

##### 2. SOAP Note Interface
**New Component:** `src/components/emr/SOAPNote.tsx`

```typescript
interface SOAPNote {
  subjective: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
    reviewOfSystems: string[];
  };
  objective: {
    vitalSigns: VitalSigns;
    physicalExam: PhysicalExam;
    labResults: LabResult[];
  };
  assessment: {
    diagnosis: string;
    differentials: string[];
  };
  plan: {
    medications: Medication[];
    procedures: Procedure[];
    followUp: string;
  };
}
```

**Features:**
- Template-based input
- Auto-populate from case data
- Validation checks
- Save as draft

##### 3. Vital Signs Visualization
**New Component:** `src/components/emr/VitalSignsChart.tsx`

```typescript
// Chart showing trends:
- Temperature
- Blood Pressure (systolic/diastolic)
- Heart Rate
- Respiratory Rate
- SpO2
```

**Library:** Recharts for line charts

##### 4. Lab Results Display
**New Component:** `src/components/emr/LabResults.tsx`

**Features:**
- Tabular view
- Flag abnormal values (H/L)
- Trend arrows
- Reference ranges
- Interpretation tooltips

#### Sprint 4 Deliverables ✅
- ✅ **Patient Timeline** – `PatientTimeline.tsx` menyusun alur kronologis (presentasi, vital, lab, tindakan) lengkap dengan filter event & badge severitas.
- ✅ **Vital Signs Visualization** – `VitalSignsChart.tsx` memakai Recharts untuk memplot HR, RR, suhu, dan SpO₂ dengan tren deterministik plus guard SSR.
- ✅ **Lab Results Display** – `LabResults.tsx` menggantikan tab “Lab & Penunjang” dengan tabel referensi, flag abnormal, catatan, serta daftar imaging.
- ✅ **Treatment Progress Tracker** – `TreatmentProgress.tsx` mengubah rencana tatalaksana menjadi checklist interaktif dengan progress bar dan penyimpanan lokal per kasus.
- ✅ **SOAP Note Interface** – `SOAPNote.tsx` menyediakan template Subjective/Objective/Assessment/Plan yang otomatis terisi data kasus + auto-save draft.
- ✅ **Workspace EMR Integration** – `pembelajaran.tsx` menambahkan tab “Workspace EMR” yang merangkai timeline, chart, tracker, dan SOAP note dalam satu layar untuk menjaga alur belajar sesuai diagram MVP.

---

### 📋 **Sprint 5 - Adaptive Learning**
**Target:** Implement personalization & recommendations

#### Features:

##### 1. Performance Profiling
**New Service:** `src/services/analytics/PerformanceAnalyzer.ts`

```typescript
interface StudentProfile {
  strengths: {
    departments: string[]; // Good at: Internal, Surgery
    skdiLevels: number[]; // Good at level 1, 2
    reasoning: {
      problemRep: number; // score /10
      ddx: number;
      justification: number;
    }
  };

  weaknesses: {
    departments: string[]; // Weak at: Pediatrics
    skdiLevels: number[];
    commonErrors: string[];
    knowledgeGaps: string[];
  };

  learningStyle: {
    preferredDifficulty: 'easy' | 'medium' | 'hard';
    timeOfDay: 'morning' | 'afternoon' | 'evening';
    sessionDuration: number; // minutes
  };
}
```

**Implementation:**
- Analyze quiz scores by department
- Identify error patterns
- Track time spent per difficulty
- Machine learning model (optional)

##### 2. Case Recommendation Engine
**New Service:** `src/services/recommendations/CaseRecommender.ts`

```typescript
interface Recommendation {
  case: CaseData;
  reason: string; // Why recommended
  priority: number; // 1-5
  expectedBenefit: string;
}

// Algorithm:
function recommendCases(profile: StudentProfile): Recommendation[] {
  // 1. Fill knowledge gaps (weak departments)
  // 2. Progressive difficulty
  // 3. SKDI level advancement
  // 4. Spaced repetition
  // 5. Variety (different departments)
}
```

##### 3. Personalized Learning Path
**New Component:** `src/components/learning-path/LearningPath.tsx`

```typescript
interface LearningPath {
  currentLevel: number; // SKDI level
  milestones: Milestone[];
  recommendedCases: CaseData[];
  estimatedCompletion: Date;

  progress: {
    completed: number;
    inProgress: number;
    upcoming: number;
  }
}

interface Milestone {
  id: string;
  title: string; // "Master SKDI Level 2 Internal Medicine"
  description: string;
  requirements: Requirement[];
  reward: Badge | XP;
  status: 'locked' | 'available' | 'in_progress' | 'completed';
}
```

**UI:**
- Visual roadmap
- Unlock progression
- Milestone tracking
- Achievement celebration

##### 4. Difficulty Adjustment
**Algorithm:**

```typescript
function adjustDifficulty(
  currentDifficulty: Difficulty,
  recentPerformance: Performance[]
): Difficulty {
  const avgScore = calculateAverage(recentPerformance);

  // If consistently scoring >80%, increase difficulty
  if (avgScore > 80) return increaseDifficulty(currentDifficulty);

  // If consistently scoring <50%, decrease difficulty
  if (avgScore < 50) return decreaseDifficulty(currentDifficulty);

  // Otherwise maintain
  return currentDifficulty;
}
```

---

### 📋 **Sprint 6 - Teacher Portal**
**Target:** Tools for instructors to monitor & assess

#### Features:

##### 1. Teacher Dashboard
**New Route:** `src/routes/teacher/dashboard.tsx`

```typescript
interface TeacherDashboard {
  classOverview: {
    totalStudents: number;
    activeToday: number;
    averageScore: number;
    completionRate: number;
  };

  studentList: StudentSummary[];
  alerts: Alert[]; // Students needing attention
  recentActivity: Activity[];
}

interface StudentSummary {
  id: number;
  name: string;
  progress: number; // percentage
  lastActive: Date;
  averageScore: number;
  atRisk: boolean; // flag for intervention
}
```

**Features:**
- Sortable student table
- Filter by performance
- Quick actions (message, review)
- Export to CSV

##### 2. Student Detail View
**New Route:** `src/routes/teacher/student/[id].tsx`

```typescript
interface StudentDetail {
  profile: StudentProfile;
  caseHistory: CaseAttempt[];
  reasoning: ReasoningSummary[];
  reflections: Reflection[];
  timelineActivity: ActivityLog[];

  recommendations: {
    intervention: string[];
    resources: string[];
    nextCases: CaseData[];
  }
}
```

**Features:**
- Complete activity history
- Reasoning quality over time
- Manual grading interface
- Private notes

##### 3. Rubrik SKDI Implementation
**New Component:** `src/components/teacher/SKDIRubric.tsx`

```typescript
interface SKDIRubric {
  level: 1 | 2 | 3 | 4;
  criteria: {
    knowledge: RubricCriteria;
    skills: RubricCriteria;
    attitude: RubricCriteria;
  };

  scoring: {
    maxPoints: number;
    passingScore: number;
    grading: GradingScale;
  }
}

interface RubricCriteria {
  description: string;
  indicators: string[];
  levels: {
    exemplary: string;
    proficient: string;
    developing: string;
    novice: string;
  }
}
```

##### 4. Intervention System
**New Service:** `src/services/interventions/InterventionEngine.ts`

```typescript
// Auto-detect students needing help
interface InterventionTrigger {
  type: 'low_score' | 'inactivity' | 'struggle' | 'knowledge_gap';
  severity: 'low' | 'medium' | 'high';
  studentId: number;
  recommendation: string;
}

// Examples:
// - Score <50% for 3 consecutive cases
// - Inactive for 7 days
// - Struggling with same topic repeatedly
```

---

### 📋 **Sprint 7 - Gamification**
**Target:** Increase engagement through game mechanics

#### Features:

##### 1. Level System
**New Service:** `src/services/gamification/LevelSystem.ts`

```typescript
interface Level {
  number: number;
  name: string; // "Intern", "Resident", "Specialist"
  xpRequired: number;
  perks: Perk[];
  badge: string;
}

interface XP {
  caseCo mpletion: number; // 100 XP
  quizPerfect: number; // 50 XP
  reflectionQuality: number; // 25 XP
  dailyStreak: number; // 10 XP/day
  peakPerformance: number; // 200 XP bonus
}
```

**UI:**
- Progress bar to next level
- XP breakdown
- Level-up animation
- Unlock notifications

##### 2. Achievement Badges
**New Component:** `src/components/gamification/BadgeSystem.tsx`

```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';

  unlockCriteria: {
    type: 'case_count' | 'perfect_score' | 'streak' | 'speed' | 'mastery';
    threshold: number;
  };
}

// Example badges:
// - "First Case" - Complete first case
// - "Perfect 10" - Get 100% on 10 cases
// - "Speed Demon" - Complete case in <15 mins
// - "Department Master" - Complete all cases in one department
// - "SKDI Elite" - Master all Level 4 cases
```

##### 3. Leaderboard
**New Component:** `src/components/gamification/Leaderboard.tsx`

```typescript
interface LeaderboardEntry {
  rank: number;
  studentId: number;
  name: string;
  score: number;
  level: number;
  badges: Badge[];
  trend: 'up' | 'down' | 'same';
}

// Multiple leaderboards:
// - Overall XP
// - This Week
// - By Department
// - By SKDI Level
```

**Features:**
- Real-time updates
- Filter options
- Your ranking highlight
- Prize/rewards (optional)

##### 4. Branching Scenarios
**New Feature:** Dynamic case progression

```typescript
interface BranchingCase extends CaseData {
  decisionPoints: DecisionPoint[];
}

interface DecisionPoint {
  trigger: string; // e.g., "After physical exam"
  question: string;
  choices: Choice[];
}

interface Choice {
  text: string;
  consequences: {
    nextSection: string;
    scoreImpact: number;
    feedback: string;
  };
}
```

**Example:**
```
Patient with chest pain
└─ Do you order: ECG, Cardiac markers, or CT scan?
   ├─ ECG → Reveals ST elevation → Immediate pathway
   ├─ Cardiac markers → Delayed diagnosis → Score -10
   └─ CT scan → Unnecessary radiation → Score -5
```

---

### 📋 **Sprint 8 - Advanced Assessment**
**Target:** Peer review, SCT, advanced analytics

#### Features:

##### 1. Peer Review System
**New Component:** `src/components/peer-review/PeerReview.tsx`

```typescript
interface PeerReview {
  reviewerId: number;
  revieweeId: number;
  caseId: string;

  ratings: {
    problemRep: number; // 1-5
    ddxQuality: number;
    reasoning: number;
    documentation: number;
  };

  comments: {
    strengths: string;
    improvements: string;
  };

  anonymous: boolean;
}
```

**Workflow:**
1. Student completes case
2. System assigns 2-3 peers to review
3. Peers review reasoning & reflection
4. Aggregated feedback shown to student
5. Reviewer gets XP for quality reviews

##### 2. Script Concordance Test (SCT)
**New Component:** `src/components/sct/SCTQuestion.tsx`

```typescript
interface SCTQuestion {
  scenario: string;
  newInformation: string;
  hypothesis: string;

  // Likert scale: -2, -1, 0, +1, +2
  expertPanel: number[]; // Array of expert responses

  scoring: {
    studentAnswer: number;
    panelMode: number; // Most common expert answer
    concordance: number; // How close to expert consensus
  }
}
```

**Example:**
```
Scenario: 65F with SOB
If you were thinking: Heart Failure

And then you find: BNP 50 (normal)
Your hypothesis becomes:
[-2] Much less likely
[-1] Less likely
[0] Neither more nor less likely
[+1] More likely
[+2] Much more likely

Expert panel: [-2: 60%, -1: 30%, 0: 10%]
Student answer: -2 → High concordance → Full points
```

##### 3. Error Pattern Analysis
**New Service:** `src/services/analytics/ErrorAnalyzer.ts`

```typescript
interface ErrorPattern {
  category: 'diagnostic' | 'procedural' | 'knowledge' | 'reasoning';
  description: string;
  frequency: number;
  relatedCases: CaseData[];

  remediation: {
    resources: Resource[];
    recommendedCases: CaseData[];
    exercises: Exercise[];
  }
}

// ML-based pattern detection:
// - Consistently missing certain diagnoses
// - Ordering wrong tests
// - Misinterpreting lab results
// - Weak in specific clinical reasoning steps
```

##### 4. National Benchmark
**New Feature:** Compare with national data

```typescript
interface BenchmarkComparison {
  student: PerformanceMetrics;
  institution: PerformanceMetrics;
  national: PerformanceMetrics;

  percentile: number; // Where student stands
  strengths: string[];
  improvement Areas: string[];
}
```

---

## 🎨 UI/UX Improvements

### Design System
**File:** `src/styles/design-system.ts`

```typescript
// Color palette
const colors = {
  // SKDI levels
  skdi1: '#10b981', // green
  skdi2: '#f59e0b', // amber
  skdi3: '#f97316', // orange
  skdi4: '#ef4444', // red

  // Departments
  internal: '#3b82f6',
  surgery: '#8b5cf6',
  pediatric: '#ec4899',
  obgyn: '#f97316',

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
}
```

### Component Library
- Consistent button styles
- Form components
- Modal patterns
- Card layouts
- Navigation patterns

### Accessibility
- Keyboard navigation
- Screen reader support
- Color contrast (WCAG AA)
- Focus indicators
- Alt text for images

---

## 🔐 Security & Privacy

### Data Privacy
```typescript
// Anonymize peer reviews
// Encrypt sensitive data
// GDPR compliance
// Student data ownership
```

### Authentication
```typescript
// Role-based access control (RBAC)
// Student vs Teacher permissions
// Secure password hashing
// Session management
```

---

## 📊 Analytics & Reporting

### Student Reports
```typescript
interface StudentReport {
  summary: PerformanceSummary;
  casesCompleted: CaseAttempt[];
  skillsMatrix: SkillsMatrix;
  progressChart: ChartData;
  recommendations: Recommendation[];
  certificates: Certificate[];
}
```

### Institution Reports
```typescript
interface InstitutionReport {
  cohortAnalytics: CohortAnalytics;
  departmentComparison: DepartmentComparison;
  outcomeMetrics: OutcomeMetrics;
  trends: TrendAnalysis;
}
```

---

## 🚀 Deployment Strategy

### Development
```bash
# Local development
pnpm dev

# Database migrations
pnpm db:push

# Type checking
pnpm typecheck
```

### Staging
```bash
# Deploy to staging
vercel --env=staging

# Run E2E tests
pnpm test:e2e
```

### Production
```bash
# Deploy to production
vercel --prod

# Monitor
vercel logs
```

---

## 📈 Success Metrics

### User Engagement
- Daily Active Users (DAU)
- Session duration
- Case completion rate
- Return rate (D7, D30)

### Learning Outcomes
- Pre/post assessment improvement
- Clinical reasoning scores
- SKDI competency achievement
- Graduation readiness

### System Performance
- Page load time < 2s
- API response < 500ms
- 99.9% uptime
- Error rate < 0.1%

---

## 🔮 Future Enhancements

### Phase 2 (6-12 months)
- [ ] AI-powered case generation
- [ ] Virtual patient interaction (chatbot)
- [ ] Mobile app (React Native)
- [ ] Integration with hospital EMR
- [ ] Video case presentations
- [ ] Telemedicine simulation

### Phase 3 (12-24 months)
- [ ] VR/AR clinical scenarios
- [ ] International collaboration
- [ ] Research data export
- [ ] API for third-party integrations
- [ ] White-label solution for other institutions

---

## 📚 Resources & References

### Clinical Reasoning
- [NEJM Clinical Reasoning Cases](https://www.nejm.org/clinical-problem-solving)
- [Script Concordance Test Framework](https://www.sctnetwork.org/)
- [Diagnostic Error in Medicine](https://www.ahrq.gov/patient-safety/settings/hospital/red-flag/index.html)

### SKDI
- [Standar Kompetensi Dokter Indonesia](https://www.kki.go.id/)

### Educational Theory
- [Adaptive Learning Systems](https://er.educause.edu/articles/2016/3/adaptive-learning-systems)
- [Gamification in Medical Education](https://mededu.jmir.org/2021/4/e30779)

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
**Next Review:** Sprint 4 planning
