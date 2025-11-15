import { decimal, index, integer, jsonb, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const cases = pgTable('cases', {
  id: serial('id').primaryKey(),
  caseId: varchar('case_id', { length: 50 }).notNull().unique(),
  department: varchar('department', { length: 50 }).notNull(),
  skdiDiagnosis: text('skdi_diagnosis').notNull(),
  icd10: varchar('icd10', { length: 20 }),
  skdiLevel: varchar('skdi_level', { length: 10 }),
  difficulty: varchar('difficulty', { length: 20 }),
  caseData: jsonb('case_data').notNull(), // All case information as JSONB
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  departmentIdx: index('idx_cases_department').on(table.department),
  difficultyIdx: index('idx_cases_difficulty').on(table.difficulty),
}));

export const studentCaseAttempts = pgTable('student_case_attempts', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull().references(() => users.id),
  caseId: varchar('case_id', { length: 50 }).notNull().references(() => cases.caseId),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  timeSpentSeconds: integer('time_spent_seconds'),
  status: varchar('status', { length: 20 }).notNull().default('in_progress'), // 'in_progress', 'completed', 'abandoned'
}, (table) => ({
  studentIdx: index('idx_attempts_student').on(table.studentId),
  caseIdx: index('idx_attempts_case').on(table.caseId),
  statusIdx: index('idx_attempts_status').on(table.status),
}));

export const quizSubmissions = pgTable('quiz_submissions', {
  id: serial('id').primaryKey(),
  attemptId: integer('attempt_id').notNull().references(() => studentCaseAttempts.id),
  studentId: integer('student_id').notNull().references(() => users.id),
  caseId: varchar('case_id', { length: 50 }).notNull().references(() => cases.caseId),
  answers: jsonb('answers').notNull(), // {question_id: answer_index}
  score: decimal('score', { precision: 5, scale: 2 }),
  maxScore: integer('max_score'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
}, (table) => ({
  studentIdx: index('idx_quiz_student').on(table.studentId),
  caseIdx: index('idx_quiz_case').on(table.caseId),
}));

export const studentReflections = pgTable('student_reflections', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull().references(() => users.id),
  caseId: varchar('case_id', { length: 50 }).notNull().references(() => cases.caseId),
  attemptId: integer('attempt_id').references(() => studentCaseAttempts.id),
  what: text('what'),
  soWhat: text('so_what'),
  nowWhat: text('now_what'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  studentIdx: index('idx_reflections_student').on(table.studentId),
  caseIdx: index('idx_reflections_case').on(table.caseId),
}));

export const clinicalReasoning = pgTable('clinical_reasoning', {
  id: serial('id').primaryKey(),
  attemptId: integer('attempt_id').notNull().references(() => studentCaseAttempts.id),
  studentId: integer('student_id').notNull().references(() => users.id),
  caseId: varchar('case_id', { length: 50 }).notNull().references(() => cases.caseId),

  // Problem Representation - One-liner summary of the case
  problemRepresentation: jsonb('problem_representation'), // {summary, demographics, chiefComplaint, timeline, context, acuity, severity, pattern}

  // Differential Diagnoses - List of possible diagnoses with evidence
  differentialDiagnoses: jsonb('differential_diagnoses'), // Array of {id, diagnosis, likelihood, supportingEvidence, againstEvidence, rank}

  // Decision Justification - Clinical reasoning explanation
  decisionJustification: text('decision_justification'),
  evidenceReferences: jsonb('evidence_references'), // Array of {source, url, description}

  // Scoring - Automated assessment of clinical reasoning quality
  reasoningScore: decimal('reasoning_score', { precision: 5, scale: 2 }),
  scoreBreakdown: jsonb('score_breakdown'), // {problemRep: score, ddx: score, justification: score, total: score}

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  attemptIdx: index('idx_reasoning_attempt').on(table.attemptId),
  studentIdx: index('idx_reasoning_student').on(table.studentId),
  caseIdx: index('idx_reasoning_case').on(table.caseId),
}));
