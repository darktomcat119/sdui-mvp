import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { centralConfigService } from '../../services/central-config.service';
import type { CentralConfigVersion } from '../../services/central-config.service';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { StatusBadge } from '../../components/ui/StatusBadge/StatusBadge';
import { Icon } from '../../components/ui/Icon/Icon';

export function CentralConfigPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [versions, setVersions] = useState<CentralConfigVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    pSuperficieMin: '0.25', pSuperficieMax: '0.40',
    pZonaMin: '0.20', pZonaMax: '0.30',
    pGiroMin: '0.15', pGiroMax: '0.25',
    pTipoMin: '0.10', pTipoMax: '0.20',
    zonaMultMin: '0.50', zonaMultMax: '2.00',
    variacionLimitMin: '0.10', variacionLimitMax: '0.50',
    itdThresholdProtegido: '0.33', itdThresholdProporcional: '0.66',
    justification: '',
  });

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await centralConfigService.getHistory();
      setVersions(res.data);
    } catch {
      addToast({ variant: 'error', message: t('centralConfig.loadError') });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      await centralConfigService.create({
        pSuperficieMin: parseFloat(form.pSuperficieMin),
        pSuperficieMax: parseFloat(form.pSuperficieMax),
        pZonaMin: parseFloat(form.pZonaMin),
        pZonaMax: parseFloat(form.pZonaMax),
        pGiroMin: parseFloat(form.pGiroMin),
        pGiroMax: parseFloat(form.pGiroMax),
        pTipoMin: parseFloat(form.pTipoMin),
        pTipoMax: parseFloat(form.pTipoMax),
        zonaMultMin: parseFloat(form.zonaMultMin),
        zonaMultMax: parseFloat(form.zonaMultMax),
        variacionLimitMin: parseFloat(form.variacionLimitMin),
        variacionLimitMax: parseFloat(form.variacionLimitMax),
        itdThresholdProtegido: parseFloat(form.itdThresholdProtegido),
        itdThresholdProporcional: parseFloat(form.itdThresholdProporcional),
        justification: form.justification || null,
      });
      addToast({ variant: 'success', message: t('centralConfig.createSuccess') });
      setShowForm(false);
      await loadHistory();
    } catch {
      addToast({ variant: 'error', message: t('centralConfig.createError') });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await centralConfigService.activate(id);
      addToast({ variant: 'success', message: t('centralConfig.activateSuccess') });
      await loadHistory();
    } catch {
      addToast({ variant: 'error', message: t('centralConfig.activateError') });
    }
  };

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="text-medium-gray text-body p-xl text-center">{t('common.loading')}</div>;
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex justify-between items-center">
        <span className="text-small text-medium-gray">
          {versions.length} {t('centralConfig.versions')}
        </span>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          <Icon name="plus" size={18} />
          {t('centralConfig.newVersion')}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white border border-border rounded-md p-xl">
          <h3 className="text-body font-semibold text-black m-0 mb-lg">
            {t('centralConfig.newVersion')}
          </h3>

          <div className="grid grid-cols-2 gap-lg mb-lg">
            <RangeInput
              label={t('config.surface')}
              minVal={form.pSuperficieMin}
              maxVal={form.pSuperficieMax}
              onMinChange={(v) => updateForm('pSuperficieMin', v)}
              onMaxChange={(v) => updateForm('pSuperficieMax', v)}
            />
            <RangeInput
              label={t('config.zone')}
              minVal={form.pZonaMin}
              maxVal={form.pZonaMax}
              onMinChange={(v) => updateForm('pZonaMin', v)}
              onMaxChange={(v) => updateForm('pZonaMax', v)}
            />
            <RangeInput
              label={t('config.giro')}
              minVal={form.pGiroMin}
              maxVal={form.pGiroMax}
              onMinChange={(v) => updateForm('pGiroMin', v)}
              onMaxChange={(v) => updateForm('pGiroMax', v)}
            />
            <RangeInput
              label={t('config.type')}
              minVal={form.pTipoMin}
              maxVal={form.pTipoMax}
              onMinChange={(v) => updateForm('pTipoMin', v)}
              onMaxChange={(v) => updateForm('pTipoMax', v)}
            />
            <RangeInput
              label={t('centralConfig.zoneMultiplier')}
              minVal={form.zonaMultMin}
              maxVal={form.zonaMultMax}
              onMinChange={(v) => updateForm('zonaMultMin', v)}
              onMaxChange={(v) => updateForm('zonaMultMax', v)}
            />
            <RangeInput
              label={t('centralConfig.variationLimit')}
              minVal={form.variacionLimitMin}
              maxVal={form.variacionLimitMax}
              onMinChange={(v) => updateForm('variacionLimitMin', v)}
              onMaxChange={(v) => updateForm('variacionLimitMax', v)}
            />
          </div>

          <div className="grid grid-cols-2 gap-lg mb-lg">
            <Input
              label={t('centralConfig.thresholdProtegido')}
              type="number"
              value={form.itdThresholdProtegido}
              onChange={(e) => updateForm('itdThresholdProtegido', e.target.value)}
            />
            <Input
              label={t('centralConfig.thresholdProporcional')}
              type="number"
              value={form.itdThresholdProporcional}
              onChange={(e) => updateForm('itdThresholdProporcional', e.target.value)}
            />
          </div>

          <div className="mb-lg">
            <label className="block text-small font-medium text-dark-gray mb-xs">
              {t('config.justification')}
            </label>
            <textarea
              className="w-full min-h-[80px] border border-border rounded-sm p-sm text-small font-primary resize-y"
              value={form.justification}
              onChange={(e) => updateForm('justification', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-sm">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleCreate} disabled={saving}>
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      )}

      {/* Version History */}
      {versions.map((v) => (
        <div key={v.id} className="bg-white border border-border rounded-md p-xl">
          <div className="flex justify-between items-center mb-md">
            <div className="flex items-center gap-md">
              <span className="font-mono font-semibold text-body">v{v.version}</span>
              <StatusBadge
                status={v.active ? 'active' : 'info'}
                label={v.active ? t('centralConfig.active') : t('centralConfig.inactive')}
              />
            </div>
            {!v.active && (
              <Button variant="secondary" onClick={() => handleActivate(v.id)}>
                {t('centralConfig.activate')}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-md text-small">
            <RangeDisplay label={t('config.surface')} min={v.pSuperficieMin} max={v.pSuperficieMax} pct />
            <RangeDisplay label={t('config.zone')} min={v.pZonaMin} max={v.pZonaMax} pct />
            <RangeDisplay label={t('config.giro')} min={v.pGiroMin} max={v.pGiroMax} pct />
            <RangeDisplay label={t('config.type')} min={v.pTipoMin} max={v.pTipoMax} pct />
            <RangeDisplay label={t('centralConfig.zoneMultiplier')} min={v.zonaMultMin} max={v.zonaMultMax} />
            <RangeDisplay label={t('centralConfig.variationLimit')} min={v.variacionLimitMin} max={v.variacionLimitMax} pct />
          </div>
          {v.justification && (
            <p className="text-small text-medium-gray mt-md">{v.justification}</p>
          )}
          <p className="text-caption text-light-gray mt-sm">
            {new Date(v.createdAt).toLocaleDateString('es-MX')}
          </p>
        </div>
      ))}
    </div>
  );
}

function RangeInput({
  label, minVal, maxVal, onMinChange, onMaxChange,
}: {
  label: string; minVal: string; maxVal: string;
  onMinChange: (v: string) => void; onMaxChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="text-small font-medium text-dark-gray">{label}</span>
      <div className="flex gap-sm mt-xs">
        <Input label="Min" type="number" value={minVal} onChange={(e) => onMinChange(e.target.value)} />
        <Input label="Max" type="number" value={maxVal} onChange={(e) => onMaxChange(e.target.value)} />
      </div>
    </div>
  );
}

function RangeDisplay({ label, min, max, pct }: { label: string; min: number; max: number; pct?: boolean }) {
  const fmt = (v: number) => pct ? `${(Number(v) * 100).toFixed(0)}%` : Number(v).toFixed(2);
  return (
    <div>
      <span className="text-medium-gray">{label}</span>
      <p className="font-mono text-dark-gray mt-[2px] mb-0">{fmt(min)} – {fmt(max)}</p>
    </div>
  );
}
