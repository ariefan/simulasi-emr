import { useState } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { DifferentialDiagnosis } from '@/types/clinical-reasoning';

interface DDxBuilderProps {
  differentials: DifferentialDiagnosis[];
  onChange: (differentials: DifferentialDiagnosis[]) => void;
  disabled?: boolean;
}

export function DDxBuilder({ differentials, onChange, disabled = false }: DDxBuilderProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addDifferential = () => {
    const newDdx: DifferentialDiagnosis = {
      id: `ddx-${Date.now()}`,
      diagnosis: '',
      likelihood: 'medium',
      supportingEvidence: [],
      againstEvidence: [],
      rank: differentials.length + 1,
    };
    onChange([...differentials, newDdx]);
    setExpandedId(newDdx.id);
  };

  const removeDifferential = (id: string) => {
    const updated = differentials.filter((d) => d.id !== id);
    // Rerank remaining differentials
    const reranked = updated.map((d, index) => ({ ...d, rank: index + 1 }));
    onChange(reranked);
  };

  const updateDifferential = (id: string, updates: Partial<DifferentialDiagnosis>) => {
    const updated = differentials.map((d) => (d.id === id ? { ...d, ...updates } : d));
    onChange(updated);
  };

  const moveUp = (id: string) => {
    const index = differentials.findIndex((d) => d.id === id);
    if (index === 0) return;

    const updated = [...differentials];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Update ranks
    const reranked = updated.map((d, idx) => ({ ...d, rank: idx + 1 }));
    onChange(reranked);
  };

  const moveDown = (id: string) => {
    const index = differentials.findIndex((d) => d.id === id);
    if (index === differentials.length - 1) return;

    const updated = [...differentials];
    [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
    // Update ranks
    const reranked = updated.map((d, idx) => ({ ...d, rank: idx + 1 }));
    onChange(reranked);
  };

  const addEvidence = (id: string, type: 'supporting' | 'against') => {
    const ddx = differentials.find((d) => d.id === id);
    if (!ddx) return;

    const field = type === 'supporting' ? 'supportingEvidence' : 'againstEvidence';
    updateDifferential(id, {
      [field]: [...(ddx[field] || []), ''],
    });
  };

  const updateEvidence = (
    id: string,
    type: 'supporting' | 'against',
    index: number,
    value: string
  ) => {
    const ddx = differentials.find((d) => d.id === id);
    if (!ddx) return;

    const field = type === 'supporting' ? 'supportingEvidence' : 'againstEvidence';
    const updated = [...(ddx[field] || [])];
    updated[index] = value;
    updateDifferential(id, { [field]: updated });
  };

  const removeEvidence = (id: string, type: 'supporting' | 'against', index: number) => {
    const ddx = differentials.find((d) => d.id === id);
    if (!ddx) return;

    const field = type === 'supporting' ? 'supportingEvidence' : 'againstEvidence';
    const updated = (ddx[field] || []).filter((_, i) => i !== index);
    updateDifferential(id, { [field]: updated });
  };

  const getLikelihoodBadge = (likelihood: string) => {
    const colors = {
      'very-high': 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
      'very-low': 'bg-slate-100 text-slate-800',
    };
    return colors[likelihood as keyof typeof colors] || colors.medium;
  };

  const getLikelihoodLabel = (likelihood: string) => {
    const labels = {
      'very-high': 'Sangat Tinggi',
      high: 'Tinggi',
      medium: 'Sedang',
      low: 'Rendah',
      'very-low': 'Sangat Rendah',
    };
    return labels[likelihood as keyof typeof labels] || 'Sedang';
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-sm text-blue-900 mb-2">
          💡 Differential Diagnosis (DDx)
        </h3>
        <p className="text-xs text-blue-800">
          Buat daftar diagnosis diferensial yang mungkin berdasarkan temuan klinis. Urutkan dari yang
          paling mungkin ke yang paling tidak mungkin. Berikan bukti yang mendukung dan menolak setiap diagnosis.
        </p>
      </div>

      {differentials.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          Belum ada diagnosis diferensial. Klik tombol di bawah untuk menambahkan.
        </div>
      ) : (
        <div className="space-y-3">
          {differentials.map((ddx, index) => (
            <div
              key={ddx.id}
              className="border border-slate-200 rounded-lg p-4 bg-white hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-slate-700">#{ddx.rank}</span>
                    <Input
                      placeholder="Nama diagnosis..."
                      value={ddx.diagnosis}
                      onChange={(e) => updateDifferential(ddx.id, { diagnosis: e.target.value })}
                      disabled={disabled}
                      className="flex-1 text-sm font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Label className="text-xs text-slate-600">Kemungkinan:</Label>
                    <select
                      value={ddx.likelihood}
                      onChange={(e) =>
                        updateDifferential(ddx.id, { likelihood: e.target.value as any })
                      }
                      disabled={disabled}
                      className="px-2 py-1 border border-slate-300 rounded text-xs"
                    >
                      <option value="very-high">Sangat Tinggi</option>
                      <option value="high">Tinggi</option>
                      <option value="medium">Sedang</option>
                      <option value="low">Rendah</option>
                      <option value="very-low">Sangat Rendah</option>
                    </select>
                    <Badge className={`${getLikelihoodBadge(ddx.likelihood)} text-xs px-2 py-0`}>
                      {getLikelihoodLabel(ddx.likelihood)}
                    </Badge>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === ddx.id && (
                    <div className="space-y-3 mt-3 pt-3 border-t">
                      {/* Supporting Evidence */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-semibold text-green-700">
                            ✓ Bukti Mendukung
                          </Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addEvidence(ddx.id, 'supporting')}
                            disabled={disabled}
                            className="h-6 text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Tambah
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(ddx.supportingEvidence || []).map((evidence, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input
                                placeholder="Contoh: Nyeri dada substernal"
                                value={evidence}
                                onChange={(e) =>
                                  updateEvidence(ddx.id, 'supporting', idx, e.target.value)
                                }
                                disabled={disabled}
                                className="text-xs"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeEvidence(ddx.id, 'supporting', idx)}
                                disabled={disabled}
                                className="h-9 px-2"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Against Evidence */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-semibold text-red-700">
                            ✗ Bukti Menolak
                          </Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addEvidence(ddx.id, 'against')}
                            disabled={disabled}
                            className="h-6 text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Tambah
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {(ddx.againstEvidence || []).map((evidence, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input
                                placeholder="Contoh: Tidak ada sesak napas"
                                value={evidence}
                                onChange={(e) =>
                                  updateEvidence(ddx.id, 'against', idx, e.target.value)
                                }
                                disabled={disabled}
                                className="text-xs"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeEvidence(ddx.id, 'against', idx)}
                                disabled={disabled}
                                className="h-9 px-2"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveUp(ddx.id)}
                    disabled={disabled || index === 0}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => moveDown(ddx.id)}
                    disabled={disabled || index === differentials.length - 1}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeDifferential(ddx.id)}
                    disabled={disabled}
                    className="h-7 w-7 p-0"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Toggle Details Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpandedId(expandedId === ddx.id ? null : ddx.id)}
                className="w-full mt-2 text-xs"
              >
                {expandedId === ddx.id ? 'Sembunyikan Detail' : 'Tampilkan Detail'}
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={addDifferential}
        disabled={disabled}
        variant="outline"
        className="w-full text-sm"
      >
        <Plus className="w-4 h-4 mr-2" />
        Tambah Diagnosis Diferensial
      </Button>
    </div>
  );
}
