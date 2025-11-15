import { Plus, Trash2 } from 'lucide-react';
import type { EvidenceReference } from '@/types/clinical-reasoning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DecisionJustificationProps {
  justification: string;
  references: Array<EvidenceReference>;
  onJustificationChange: (value: string) => void;
  onReferencesChange: (references: Array<EvidenceReference>) => void;
  disabled?: boolean;
}

export function DecisionJustification({
  justification,
  references,
  onJustificationChange,
  onReferencesChange,
  disabled = false,
}: DecisionJustificationProps) {
  const addReference = () => {
    const newRef: EvidenceReference = {
      source: '',
      url: '',
      description: '',
    };
    onReferencesChange([...references, newRef]);
  };

  const removeReference = (index: number) => {
    onReferencesChange(references.filter((_, i) => i !== index));
  };

  const updateReference = (index: number, updates: Partial<EvidenceReference>) => {
    const updated = references.map((ref, i) => (i === index ? { ...ref, ...updates } : ref));
    onReferencesChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-sm text-blue-900 mb-2">
          💡 Justifikasi Keputusan Klinis
        </h3>
        <p className="text-xs text-blue-800">
          Jelaskan alasan di balik keputusan klinis Anda. Mengapa Anda memilih diagnosis tertentu?
          Apa bukti ilmiah yang mendukung keputusan Anda? Bagaimana Anda menimbang berbagai pilihan?
        </p>
      </div>

      {/* Decision Justification */}
      <div>
        <Label htmlFor="justification" className="font-medium text-sm mb-2">
          Penjelasan Penalaran Klinis
        </Label>
        <p className="text-xs text-slate-600 mb-2">
          Tulis penjelasan yang jelas dan terstruktur tentang bagaimana Anda sampai pada kesimpulan klinis.
        </p>
        <Textarea
          id="justification"
          placeholder="Jelaskan penalaran klinis Anda di sini...

Contoh struktur:
1. Temuan kunci yang mengarahkan pemikiran saya...
2. Mengapa diagnosis A lebih mungkin daripada B karena...
3. Bukti yang mendukung keputusan ini termasuk...
4. Pertimbangan lain yang saya pikirkan..."
          value={justification}
          onChange={(e) => onJustificationChange(e.target.value)}
          disabled={disabled}
          className="text-sm"
          rows={10}
        />
        <div className="mt-2 text-xs text-slate-500">
          {justification.length} karakter
        </div>
      </div>

      {/* Evidence References */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <Label className="font-medium text-sm">Referensi Evidence-Based</Label>
            <p className="text-xs text-slate-600 mt-1">
              Tambahkan referensi dari guideline, jurnal, atau sumber terpercaya lainnya.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={addReference}
            disabled={disabled}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Tambah Referensi
          </Button>
        </div>

        {references.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-sm border border-dashed border-slate-300 rounded-lg">
            Belum ada referensi. Klik tombol di atas untuk menambahkan.
          </div>
        ) : (
          <div className="space-y-3">
            {references.map((ref, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-4 bg-white space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-3">
                    <div>
                      <Label className="text-xs text-slate-600">Sumber</Label>
                      <Input
                        placeholder="Contoh: ESC Guidelines on Acute Coronary Syndromes 2023"
                        value={ref.source}
                        onChange={(e) => updateReference(index, { source: e.target.value })}
                        disabled={disabled}
                        className="text-sm mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-slate-600">URL (opsional)</Label>
                      <Input
                        placeholder="https://..."
                        value={ref.url || ''}
                        onChange={(e) => updateReference(index, { url: e.target.value })}
                        disabled={disabled}
                        className="text-sm mt-1"
                        type="url"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-slate-600">Deskripsi / Kutipan Relevan</Label>
                      <Textarea
                        placeholder="Jelaskan bagaimana referensi ini mendukung keputusan Anda..."
                        value={ref.description}
                        onChange={(e) => updateReference(index, { description: e.target.value })}
                        disabled={disabled}
                        className="text-sm mt-1"
                        rows={2}
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeReference(index)}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
