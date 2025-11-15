import 'dotenv/config'; // Load environment variables

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CaseData } from '@/types/case';
import { db } from '@/db';
import { cases } from '@/db/schema';

async function importCases() {
  try {
    console.log('🚀 Starting case import from JSON...');

    // Read the JSON file
    const jsonPath = join(process.cwd(), 'public', 'cases_internal_bedah_obg.json');
    const jsonData = readFileSync(jsonPath, 'utf-8');
    const casesData: Array<CaseData> = JSON.parse(jsonData);

    console.log(`📦 Found ${casesData.length} cases in JSON file`);

    // Import cases in batches
    const batchSize = 50;
    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < casesData.length; i += batchSize) {
      const batch = casesData.slice(i, i + batchSize);

      for (const caseData of batch) {
        try {
          await db.insert(cases).values({
            caseId: caseData.case_id,
            department: caseData.department,
            skdiDiagnosis: caseData.skdi_diagnosis,
            icd10: caseData.icd10 || null,
            skdiLevel: caseData.skdi_level || null,
            difficulty: caseData.difficulty || null,
            caseData: caseData as any, // Store entire case as JSONB
          }).onConflictDoNothing(); // Skip if already exists

          imported++;

          if (imported % 10 === 0) {
            console.log(`✅ Imported ${imported} cases...`);
          }
        } catch (error) {
          console.error(`❌ Error importing case ${caseData.case_id}:`, error);
          skipped++;
        }
      }
    }

    console.log('\n✨ Import complete!');
    console.log(`✅ Successfully imported: ${imported} cases`);
    console.log(`⏭️  Skipped (duplicates): ${skipped} cases`);
    console.log(`📊 Total in JSON: ${casesData.length} cases`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
importCases();
