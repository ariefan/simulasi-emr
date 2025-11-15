import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ProblemRepresentation } from '@/types/clinical-reasoning';

interface ProblemRepresentationProps {
  data: ProblemRepresentation;
  onChange: (data: ProblemRepresentation) => void;
  disabled?: boolean;
}

export function ProblemRepresentationComponent({
  data,
  onChange,
  disabled = false,
}: ProblemRepresentationProps) {
  const handleChange = (field: keyof ProblemRepresentation, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-sm text-blue-900 mb-2">
          💡 Apa itu Problem Representation?
        </h3>
        <p className="text-xs text-blue-800">
          Problem Representation adalah ringkasan satu kalimat yang menangkap esensi kasus klinis.
          Ini membantu Anda mengorganisir temuan kunci dan memfokuskan penalaran klinis Anda.
        </p>
      </div>

      {/* One-liner Summary */}
      <div>
        <Label htmlFor="summary" className="font-medium text-sm">
          Ringkasan Satu Kalimat (One-liner)
        </Label>
        <p className="text-xs text-slate-600 mb-2">
          Gabungkan demografi, keluhan utama, timeline, dan konteks dalam satu kalimat.
        </p>
        <Textarea
          id="summary"
          placeholder="Contoh: Laki-laki 55 tahun dengan nyeri dada substernal akut onset 2 jam yang lalu saat istirahat, disertai keringat dingin dan sesak napas."
          value={data.summary}
          onChange={(e) => handleChange('summary', e.target.value)}
          disabled={disabled}
          className="text-sm"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Demographics */}
        <div>
          <Label htmlFor="demographics" className="font-medium text-xs">
            Demografi Pasien
          </Label>
          <Input
            id="demographics"
            placeholder="Contoh: 55 tahun, Laki-laki"
            value={data.demographics}
            onChange={(e) => handleChange('demographics', e.target.value)}
            disabled={disabled}
            className="text-sm"
          />
        </div>

        {/* Chief Complaint */}
        <div>
          <Label htmlFor="chiefComplaint" className="font-medium text-xs">
            Keluhan Utama
          </Label>
          <Input
            id="chiefComplaint"
            placeholder="Contoh: Nyeri dada"
            value={data.chiefComplaint}
            onChange={(e) => handleChange('chiefComplaint', e.target.value)}
            disabled={disabled}
            className="text-sm"
          />
        </div>

        {/* Timeline */}
        <div>
          <Label htmlFor="timeline" className="font-medium text-xs">
            Timeline / Onset
          </Label>
          <Input
            id="timeline"
            placeholder="Contoh: Akut onset 2 jam yang lalu"
            value={data.timeline}
            onChange={(e) => handleChange('timeline', e.target.value)}
            disabled={disabled}
            className="text-sm"
          />
        </div>

        {/* Context */}
        <div>
          <Label htmlFor="context" className="font-medium text-xs">
            Konteks / Situasi
          </Label>
          <Input
            id="context"
            placeholder="Contoh: Saat istirahat, tidak ada aktivitas"
            value={data.context}
            onChange={(e) => handleChange('context', e.target.value)}
            disabled={disabled}
            className="text-sm"
          />
        </div>
      </div>

      {/* Semantic Qualifiers */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-sm mb-3">Kualifikasi Semantik</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Acuity */}
          <div>
            <Label htmlFor="acuity" className="font-medium text-xs">
              Akuitas
            </Label>
            <select
              id="acuity"
              value={data.acuity}
              onChange={(e) => handleChange('acuity', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="">Pilih akuitas</option>
              <option value="acute">Akut</option>
              <option value="subacute">Subakut</option>
              <option value="chronic">Kronik</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <Label htmlFor="severity" className="font-medium text-xs">
              Severitas
            </Label>
            <select
              id="severity"
              value={data.severity}
              onChange={(e) => handleChange('severity', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="">Pilih severitas</option>
              <option value="mild">Ringan</option>
              <option value="moderate">Sedang</option>
              <option value="severe">Berat</option>
            </select>
          </div>

          {/* Pattern */}
          <div>
            <Label htmlFor="pattern" className="font-medium text-xs">
              Pola
            </Label>
            <Input
              id="pattern"
              placeholder="Contoh: Intermiten"
              value={data.pattern}
              onChange={(e) => handleChange('pattern', e.target.value)}
              disabled={disabled}
              className="text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
