import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CaseData } from '@/types/case';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useDebouncedCallback } from '@/hooks/use-debounce';

type SOAPNoteField = 'subjective' | 'objective' | 'assessment' | 'plan';

interface SOAPNoteState {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

const createDefaultNote = (caseData: CaseData): SOAPNoteState => ({
  subjective: [
    `Keluhan utama: ${caseData.chief_complaint}`,
    `Riwayat penyakit sekarang: ${caseData.history_of_present_illness}`,
    caseData.social_history ? `Riwayat sosial: ${caseData.social_history}` : '',
  ]
    .filter(Boolean)
    .join('\n'),
  objective: [
    caseData.physical_exam?.general ? `Status generalis: ${caseData.physical_exam.general}` : '',
    caseData.physical_exam?.vital_signs
      ? `Tanda vital: TD ${caseData.physical_exam.vital_signs.bp_mmHg || '-'}; HR ${
          caseData.physical_exam.vital_signs.hr_bpm || '-'
        } bpm; RR ${caseData.physical_exam.vital_signs.rr_per_min || '-'}x/menit; Suhu ${
          caseData.physical_exam.vital_signs.temp_c ?? '-'
        }°C`
      : '',
    caseData.laboratory ? `Laboratorium penting: ${Object.entries(caseData.laboratory)
        .filter(([key]) => key !== 'catatan')
        .slice(0, 4)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n'),
  assessment: [
    `Diagnosis Kerja: ${caseData.working_diagnosis}`,
    caseData.differential_diagnoses && caseData.differential_diagnoses.length > 0
      ? `Diagnosa Banding: ${caseData.differential_diagnoses.join(', ')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n'),
  plan: [
    caseData.management_plan?.non_pharmacological
      ? `Non-farmakologis: ${caseData.management_plan.non_pharmacological.join(', ')}`
      : '',
    caseData.management_plan?.pharmacological
      ? `Farmakologis: ${caseData.management_plan.pharmacological.join(', ')}`
      : '',
    caseData.management_plan?.monitoring ? `Monitoring: ${caseData.management_plan.monitoring}` : '',
  ]
    .filter(Boolean)
    .join('\n'),
});

const getStorageKey = (caseId: string) => `soap-note-${caseId}`;

interface SOAPNoteProps {
  caseData: CaseData;
}

export function SOAPNote({ caseData }: SOAPNoteProps) {
  const defaults = useMemo(() => createDefaultNote(caseData), [caseData]);
  const [note, setNote] = useState<SOAPNoteState>(defaults);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(getStorageKey(caseData.case_id));
    if (saved) {
      setNote(JSON.parse(saved));
      setStatus('saved');
    } else {
      setNote(defaults);
      setStatus('idle');
    }
  }, [caseData.case_id, defaults]);

  const persistDraft = useCallback(
    (draft: SOAPNoteState, notify = false) => {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(getStorageKey(caseData.case_id), JSON.stringify(draft));
      setStatus('saved');
      if (notify) {
         
        console.info('SOAP note saved locally');
      }
    },
    [caseData.case_id]
  );

  const debouncedSave = useDebouncedCallback((draft: SOAPNoteState) => {
    persistDraft(draft);
  }, 1500);

  const handleChange = (field: SOAPNoteField, value: string) => {
    setNote((prev) => {
      const updated = { ...prev, [field]: value };
      setStatus('saving');
      debouncedSave(updated);
      return updated;
    });
  };

  const handleReset = () => {
    setNote(defaults);
    persistDraft(defaults, true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-base">Catatan SOAP</CardTitle>
          <p className="text-xs text-slate-500">
            Gunakan template ini untuk menyusun dokumentasi klinis yang terstruktur.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] uppercase">
            {status === 'saving'
              ? 'Menyimpan...'
              : status === 'saved'
                ? 'Draft tersimpan'
                : 'Belum ada perubahan'}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset dari Kasus
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs font-semibold">Subjective</Label>
          <Textarea
            rows={4}
            className="mt-1 text-sm"
            value={note.subjective}
            onChange={(event) => handleChange('subjective', event.target.value)}
            placeholder="Catat keluhan utama, riwayat penyakit sekarang, dan riwayat lainnya."
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">Objective</Label>
          <Textarea
            rows={4}
            className="mt-1 text-sm"
            value={note.objective}
            onChange={(event) => handleChange('objective', event.target.value)}
            placeholder="Isi temuan fisik, tanda vital, laboratorium, dan penunjang."
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">Assessment</Label>
          <Textarea
            rows={3}
            className="mt-1 text-sm"
            value={note.assessment}
            onChange={(event) => handleChange('assessment', event.target.value)}
            placeholder="Tuliskan diagnosis kerja dan diagnosis banding."
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">Plan</Label>
          <Textarea
            rows={4}
            className="mt-1 text-sm"
            value={note.plan}
            onChange={(event) => handleChange('plan', event.target.value)}
            placeholder="Rincikan rencana tatalaksana, edukasi, monitoring, dan tindak lanjut."
          />
        </div>
      </CardContent>
    </Card>
  );
}
