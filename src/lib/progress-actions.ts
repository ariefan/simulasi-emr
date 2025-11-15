import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import {
  studentCaseAttempts,
  quizSubmissions,
  studentReflections,
} from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Start a new case attempt
export const startCaseAttempt = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    const { studentId, caseId } = data as { studentId: number; caseId: string };

    try {
      const [attempt] = await db
        .insert(studentCaseAttempts)
        .values({
          studentId,
          caseId,
          status: 'in_progress',
          startedAt: new Date(),
        })
        .returning();

      return attempt;
    } catch (error) {
      console.error('Error starting case attempt:', error);
      throw new Error('Failed to start case attempt');
    }
  }
);

// Submit quiz answers
export const submitQuiz = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    const { attemptId, studentId, caseId, answers, score, maxScore, timeSpentSeconds } = data as {
      attemptId: number;
      studentId: number;
      caseId: string;
      answers: Record<string, number>;
      score: number;
      maxScore: number;
      timeSpentSeconds?: number;
    };

    try {
      // Insert quiz submission
      const [submission] = await db
        .insert(quizSubmissions)
        .values({
          attemptId,
          studentId,
          caseId,
          answers: answers as any,
          score: score.toString(),
          maxScore,
        })
        .returning();

      // Update attempt status to completed
      await db
        .update(studentCaseAttempts)
        .set({
          status: 'completed',
          completedAt: new Date(),
          timeSpentSeconds: timeSpentSeconds ? Math.round(timeSpentSeconds) : null,
        })
        .where(eq(studentCaseAttempts.id, attemptId));

      return { ...submission, answers: submission.answers as Record<string, number> };
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw new Error('Failed to submit quiz');
    }
  }
);

// Save or update reflection
export const saveReflection = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data: unknown }) => {
    const { studentId, caseId, attemptId, what, soWhat, nowWhat } = data as {
      studentId: number;
      caseId: string;
      attemptId?: number;
      what: string;
      soWhat: string;
      nowWhat: string;
    };

    try {
      // Check if reflection already exists for this student and case
      const existing = await db
        .select()
        .from(studentReflections)
        .where(
          and(
            eq(studentReflections.studentId, studentId),
            eq(studentReflections.caseId, caseId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing reflection
        const [updated] = await db
          .update(studentReflections)
          .set({
            what,
            soWhat,
            nowWhat,
            attemptId,
            updatedAt: new Date(),
          })
          .where(eq(studentReflections.id, existing[0].id))
          .returning();

        return updated;
      } else {
        // Create new reflection
        const [created] = await db
          .insert(studentReflections)
          .values({
            studentId,
            caseId,
            attemptId,
            what,
            soWhat,
            nowWhat,
          })
          .returning();

        return created;
      }
    } catch (error) {
      console.error('Error saving reflection:', error);
      throw new Error('Failed to save reflection');
    }
  }
);

// Get student progress for all cases
export const getStudentProgress = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data: unknown }) => {
    const { studentId } = data as { studentId: number };

    try {
      // Get all attempts with quiz scores
      const attempts = await db
        .select({
          caseId: studentCaseAttempts.caseId,
          attemptId: studentCaseAttempts.id,
          startedAt: studentCaseAttempts.startedAt,
          completedAt: studentCaseAttempts.completedAt,
          status: studentCaseAttempts.status,
          score: quizSubmissions.score,
          maxScore: quizSubmissions.maxScore,
        })
        .from(studentCaseAttempts)
        .leftJoin(
          quizSubmissions,
          eq(studentCaseAttempts.id, quizSubmissions.attemptId)
        )
        .where(eq(studentCaseAttempts.studentId, studentId))
        .orderBy(desc(studentCaseAttempts.startedAt));

      // Get all reflections
      const reflections = await db
        .select()
        .from(studentReflections)
        .where(eq(studentReflections.studentId, studentId));

      // Group by case ID
      const progressByCase: Record<string, any> = {};

      attempts.forEach((attempt) => {
        if (!progressByCase[attempt.caseId]) {
          progressByCase[attempt.caseId] = {
            attempts: 0,
            lastScore: 0,
            bestScore: 0,
            lastAttemptDate: null,
          };
        }

        progressByCase[attempt.caseId].attempts += 1;

        if (attempt.score) {
          const score = parseFloat(attempt.score);
          progressByCase[attempt.caseId].lastScore = score;
          progressByCase[attempt.caseId].bestScore = Math.max(
            progressByCase[attempt.caseId].bestScore,
            score
          );
        }

        if (attempt.completedAt) {
          if (
            !progressByCase[attempt.caseId].lastAttemptDate ||
            attempt.completedAt > progressByCase[attempt.caseId].lastAttemptDate
          ) {
            progressByCase[attempt.caseId].lastAttemptDate = attempt.completedAt;
          }
        }
      });

      // Add reflection info
      reflections.forEach((reflection) => {
        if (progressByCase[reflection.caseId]) {
          progressByCase[reflection.caseId].reflection = {
            what: reflection.what,
            so_what: reflection.soWhat,
            now_what: reflection.nowWhat,
          };
          progressByCase[reflection.caseId].reflection_last_saved =
            reflection.updatedAt?.toISOString();
        }
      });

      return progressByCase;
    } catch (error) {
      console.error('Error fetching student progress:', error);
      throw new Error('Failed to fetch student progress');
    }
  }
);

// Get dashboard statistics for a student
export const getDashboardStats = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data: unknown }) => {
    const { studentId } = data as { studentId: number };

    try {
      // Get total attempts and completed cases
      const attempts = await db
        .select({
          id: studentCaseAttempts.id,
          caseId: studentCaseAttempts.caseId,
          status: studentCaseAttempts.status,
          score: quizSubmissions.score,
          startedAt: studentCaseAttempts.startedAt,
          completedAt: studentCaseAttempts.completedAt,
          timeSpentSeconds: studentCaseAttempts.timeSpentSeconds,
        })
        .from(studentCaseAttempts)
        .leftJoin(
          quizSubmissions,
          eq(studentCaseAttempts.id, quizSubmissions.attemptId)
        )
        .where(eq(studentCaseAttempts.studentId, studentId));

      // Get total reflections
      const reflections = await db
        .select()
        .from(studentReflections)
        .where(eq(studentReflections.studentId, studentId));

      // Calculate statistics
      const totalAttempts = attempts.length;
      const completedCases = new Set(
        attempts.filter((a) => a.status === 'completed').map((a) => a.caseId)
      ).size;
      const totalReflections = reflections.length;

      // Calculate average score
      const scoresWithData = attempts.filter((a) => a.score !== null);
      const averageScore =
        scoresWithData.length > 0
          ? scoresWithData.reduce((sum, a) => sum + parseFloat(a.score!), 0) /
            scoresWithData.length
          : 0;

      const now = new Date();
      const totalTimeSeconds = attempts.reduce((sum, attempt) => {
        const derived =
          attempt.timeSpentSeconds ??
          (attempt.completedAt && attempt.startedAt
            ? Math.max(
                0,
                Math.round(
                  (attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000
                )
              )
            : 0);
        return sum + derived;
      }, 0);

      const completedTodaySeconds = attempts.reduce((sum, attempt) => {
        if (!attempt.completedAt) return sum;
        const isToday =
          attempt.completedAt.getFullYear() === now.getFullYear() &&
          attempt.completedAt.getMonth() === now.getMonth() &&
          attempt.completedAt.getDate() === now.getDate();
        if (!isToday) return sum;
        const derived =
          attempt.timeSpentSeconds ??
          (attempt.startedAt
            ? Math.max(
                0,
                Math.round(
                  (attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000
                )
              )
            : 0);
        return sum + derived;
      }, 0);

      const attemptsWithTime = attempts.filter(
        (attempt) =>
          attempt.timeSpentSeconds ||
          (attempt.startedAt && attempt.completedAt)
      );
      const averageTimeSeconds =
        attemptsWithTime.length > 0
          ? Math.round(totalTimeSeconds / attemptsWithTime.length)
          : 0;

      return {
        totalAttempts,
        completedCases,
        averageScore: Math.round(averageScore),
        totalReflections,
        totalStudySeconds: totalTimeSeconds,
        averageTimeSeconds,
        timeSpentTodaySeconds: completedTodaySeconds,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }
);
