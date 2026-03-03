import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { weightsService } from '../../../services/weights.service';
import { centralConfigService } from '../../../services/central-config.service';
import type { CentralConfigVersion } from '../../../services/central-config.service';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import type { WeightConfiguration } from '../../../types/sdui.types';

// Fallback ranges when no central config exists
const DEFAULT_RANGES = {
  pSuperficie: { min: 0.25, max: 0.40 },
  pZona: { min: 0.20, max: 0.30 },
  pGiro: { min: 0.15, max: 0.25 },
  pTipo: { min: 0.10, max: 0.20 },
  variacion: { min: 0.01, max: 0.25 },
};

function getRanges(cc: CentralConfigVersion | null) {
  if (!cc) return DEFAULT_RANGES;
  return {
    pSuperficie: { min: Number(cc.pSuperficieMin), max: Number(cc.pSuperficieMax) },
    pZona: { min: Number(cc.pZonaMin), max: Number(cc.pZonaMax) },
    pGiro: { min: Number(cc.pGiroMin), max: Number(cc.pGiroMax) },
    pTipo: { min: Number(cc.pTipoMin), max: Number(cc.pTipoMax) },
    variacion: { min: Number(cc.variacionLimitMin), max: Number(cc.variacionLimitMax) },
  };
}

function fmtRange(r: { min: number; max: number }) {
  return `${(r.min * 100).toFixed(0)}%-${(r.max * 100).toFixed(0)}%`;
}

export function WeightsTab() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [config, setConfig] = useState<WeightConfiguration | null>(null);
  const [centralConfig, setCentralConfig] = useState<CentralConfigVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    pSuperficie: 0.4,
    pZona: 0.3,
    pGiro: 0.2,
    pTipo: 0.1,
    limiteVariacionPct: 0.2,
    ejercicioFiscal: new Date().getFullYear(),
    vigenciaDesde: new Date().toISOString().slice(0, 10),
    justificacion: '',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const [weightsRes, ccRes] = await Promise.all([
        weightsService.getCurrent().catch(() => null),
        centralConfigService.getActive().catch(() => null),
      ]);
      if (ccRes?.data) setCentralConfig(ccRes.data);
      if (weightsRes?.data) {
        setConfig(weightsRes.data);
        setForm({
          pSuperficie: Number(weightsRes.data.pSuperficie),
          pZona: Number(weightsRes.data.pZona),
          pGiro: Number(weightsRes.data.pGiro),
          pTipo: Number(weightsRes.data.pTipo),
          limiteVariacionPct: Number(weightsRes.data.limiteVariacionPct),
          ejercicioFiscal: weightsRes.data.ejercicioFiscal,
          vigenciaDesde: weightsRes.data.vigenciaDesde.slice(0, 10),
          justificacion: '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const ranges = getRanges(centralConfig);
  const weightSum = form.pSuperficie + form.pZona + form.pGiro + form.pTipo;
  const sumValid = Math.abs(weightSum - 1.0) < 0.001;

  const handleSave = async () => {
    if (!sumValid) {
      addToast({ variant: 'error', message: t('config.weightSumError') });
      return;
    }
    setSaving(true);
    try {
      await weightsService.create(form);
      addToast({ variant: 'success', message: t('config.weightsSaved') });
      setEditing(false);
      await loadConfig();
    } catch (err: any) {
      addToast({
        variant: 'error',
        message: err.response?.data?.message || t('config.weightsError'),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-medium-gray text-body p-xl text-center">{t('common.loading')}</div>;
  }

  return (
    <div className="flex flex-col gap-lg">
      {config && !editing ? (
        <div className="bg-white rounded-lg border border-border p-xl">
          <div className="flex justify-between items-start mb-lg">
            <div>
              <h3 className="text-subtitle font-semibold text-black m-0">
                {t('config.currentWeights')}
              </h3>
              <p className="text-small text-medium-gray mt-xs">
                {t('config.fiscalYear')}: {config.ejercicioFiscal}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              {t('config.newConfig')}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-lg">
            <WeightCard label={t('config.surface')} value={Number(config.pSuperficie)} range={fmtRange(ranges.pSuperficie)} />
            <WeightCard label={t('config.zone')} value={Number(config.pZona)} range={fmtRange(ranges.pZona)} />
            <WeightCard label={t('config.giro')} value={Number(config.pGiro)} range={fmtRange(ranges.pGiro)} />
            <WeightCard label={t('config.type')} value={Number(config.pTipo)} range={fmtRange(ranges.pTipo)} />
          </div>

          <div className="mt-lg pt-lg border-t border-border-light">
            <div className="flex gap-3xl">
              <div>
                <span className="text-small text-medium-gray">{t('config.variationLimit')}</span>
                <p className="text-subtitle font-semibold text-black mt-xs">
                  {(Number(config.limiteVariacionPct) * 100).toFixed(0)}%
                </p>
              </div>
              {config.folioActa && (
                <div>
                  <span className="text-small text-medium-gray">{t('config.folio')}</span>
                  <p className="text-body text-black mt-xs">{config.folioActa}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border p-xl">
          <h3 className="text-subtitle font-semibold text-black m-0 mb-lg">
            {config ? t('config.newConfig') : t('config.createFirst')}
          </h3>

          <div className="grid grid-cols-2 gap-lg mb-lg">
            <Input
              label={`${t('config.surface')} (${fmtRange(ranges.pSuperficie)})`}
              type="number"
              step="0.01"
              min={ranges.pSuperficie.min}
              max={ranges.pSuperficie.max}
              value={form.pSuperficie}
              onChange={(e) => setForm({ ...form, pSuperficie: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label={`${t('config.zone')} (${fmtRange(ranges.pZona)})`}
              type="number"
              step="0.01"
              min={ranges.pZona.min}
              max={ranges.pZona.max}
              value={form.pZona}
              onChange={(e) => setForm({ ...form, pZona: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label={`${t('config.giro')} (${fmtRange(ranges.pGiro)})`}
              type="number"
              step="0.01"
              min={ranges.pGiro.min}
              max={ranges.pGiro.max}
              value={form.pGiro}
              onChange={(e) => setForm({ ...form, pGiro: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label={`${t('config.type')} (${fmtRange(ranges.pTipo)})`}
              type="number"
              step="0.01"
              min={ranges.pTipo.min}
              max={ranges.pTipo.max}
              value={form.pTipo}
              onChange={(e) => setForm({ ...form, pTipo: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className={`text-small font-medium mb-lg ${sumValid ? 'text-green-700' : 'text-red-600'}`}>
            {t('config.weightSum')}: {(weightSum * 100).toFixed(1)}% {sumValid ? '✓' : `(${t('config.mustBe100')})`}
          </div>

          <div className="grid grid-cols-3 gap-lg mb-lg">
            <Input
              label={`${t('config.variationLimit')} (${fmtRange(ranges.variacion)})`}
              type="number"
              step="0.01"
              min={ranges.variacion.min}
              max={ranges.variacion.max}
              value={form.limiteVariacionPct}
              onChange={(e) => setForm({ ...form, limiteVariacionPct: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label={t('config.fiscalYear')}
              type="number"
              min="2024"
              max="2100"
              value={form.ejercicioFiscal}
              onChange={(e) => setForm({ ...form, ejercicioFiscal: parseInt(e.target.value) || 2026 })}
            />
            <Input
              label={t('config.effectiveDate')}
              type="date"
              value={form.vigenciaDesde}
              onChange={(e) => setForm({ ...form, vigenciaDesde: e.target.value })}
            />
          </div>

          <Input
            label={t('config.justification')}
            value={form.justificacion}
            onChange={(e) => setForm({ ...form, justificacion: e.target.value })}
          />

          <div className="flex gap-sm mt-lg">
            <Button variant="primary" onClick={handleSave} disabled={!sumValid || saving}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
            {config && (
              <Button variant="secondary" onClick={() => setEditing(false)}>
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WeightCard({ label, value, range }: { label: string; value: number; range: string }) {
  const pct = value * 100;
  return (
    <div className="bg-white rounded-lg border border-border p-lg border-l-[3px] border-l-action-blue">
      <div className="flex justify-between items-baseline mb-sm">
        <span className="text-small font-medium text-dark-gray">{label}</span>
        <span className="text-caption text-medium-gray">{range}</span>
      </div>
      <div className="text-[22px] font-bold font-mono text-institutional-blue mb-sm">
        {pct.toFixed(0)}%
      </div>
      <div className="w-full h-[5px] bg-[#EBF0F5] rounded-full overflow-hidden">
        <div className="h-full bg-action-blue rounded-full" style={{ width: `${pct * 2}%` }} />
      </div>
    </div>
  );
}
