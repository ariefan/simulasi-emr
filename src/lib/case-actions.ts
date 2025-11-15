import { createServerFn } from '@tanstack/react-start';
import { db } from '@/db';
import { cases } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';
import type { CaseData } from '@/types/case';

// Get all cases with optional filtering
export const getCases = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data: unknown }) => {
    const filters = data as { department?: string; search?: string; skdiLevel?: string } | undefined;

    try {
      let query = db.select().from(cases);

      // Apply filters if provided
      const filterConditions = [];

      if (filters?.department && filters.department !== 'all') {
        filterConditions.push(eq(cases.department, filters.department));
      }

      if (filters?.search) {
        filterConditions.push(
          or(
            like(cases.caseId, `%${filters.search}%`),
            like(cases.skdiDiagnosis, `%${filters.search}%`)
          )
        );
      }

      if (filters?.skdiLevel && filters.skdiLevel !== 'all') {
        filterConditions.push(eq(cases.skdiLevel, filters.skdiLevel));
      }

      if (filterConditions.length > 0) {
        query = query.where(and(...filterConditions)) as any;
      }

      const result = await query;

      // Map to CaseData format
      return result.map((row) => row.caseData as CaseData);
    } catch (error) {
      console.error('Error fetching cases:', error);
      throw new Error('Failed to fetch cases');
    }
  }
);

// Get a single case by ID
export const getCaseById = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data: unknown }) => {
    const { caseId } = data as { caseId: string };

    try {
      const result = await db
        .select()
        .from(cases)
        .where(eq(cases.caseId, caseId))
        .limit(1);

      if (result.length === 0) {
        throw new Error('Case not found');
      }

      return result[0].caseData as CaseData;
    } catch (error) {
      console.error('Error fetching case:', error);
      throw new Error('Failed to fetch case');
    }
  }
);

// Get all departments (for filter dropdown)
export const getDepartments = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const result = await db
      .selectDistinct({ department: cases.department })
      .from(cases);

    return ['all', ...result.map((r) => r.department)];
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw new Error('Failed to fetch departments');
  }
});
