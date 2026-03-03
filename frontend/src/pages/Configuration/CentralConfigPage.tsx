import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { centralConfigService } from '../../services/central-config.service';
import type { CentralConfigVersion } from '../../services/central-config.service';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { StatusBadge } from '../../components/ui/StatusBadge/StatusBadge';
import { Icon } from '../../components/ui/Icon/Icon';

const DEFAULT_FORM = {
  pSuperficieMin: '0.25', pSuperficieMax: '0.40',
  pZonaMin: '0.20', pZonaMax: '0.30',
  pGiroMin: '0.15', pGiroMax: '0.25',
  pTipoMin: '0.10', pTipoMax: '0.20',
  zonaMultMin: '0.50', zonaMultMax: '2.00',
  variacionLimitMin: '0.10', variacionLimitMax: '0.50',
  itdThresholdProtegido: '0.33', itdThresholdProporcional: '0.66',
  justification: '',
};

function versionToForm(v: CentralConfigVersion) {
  return {
    pSuperficieMin: String(v.pSuperficieMin), pSuperficieMax: String(v.pSuperficieMax),
    pZonaMin: String(v.pZonaMin), pZonaMax: String(v.pZonaMax),
    pGiroMin: String(v.pGiroMin), pGiroMax: String(v.pGiroMax),
    pTipoMin: String(v.pTipoMin), pTipoMax: String(v.pTipoMax),
    zonaMultMin: String(v.zonaMultMin), zonaMultMax: String(v.zonaMultMax),
    variacionLimitMin: String(v.variacionLimitMin), variacionLimitMax: String(v.variacionLimitMax),
    itdThresholdProtegido: String(v.itdThresholdProtegido), itdThresholdProporcional: String(v.itdThresholdProporcional),
    justification: v.justification || '',
  };
}

function formToPayload(form: typeof DEFAULT_FORM) {
  return {
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
  };
}

export function CentralConfigPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [versions, setVersions] = useState<CentralConfigVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state: 'create' = new version, string = editing version by id, null = closed
  const [formMode, setFormMode] = useState<'create' | string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

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

  const openCreate = () => {
    setForm(DEFAULT_FORM);
    setFormMode('create');
  };

  const openEdit = (v: CentralConfigVersion) => {
    if (v.active) {
      // For active version, pre-fill a NEW version form based on its values
      setForm(versionToForm(v));
      setFormMode('create');
    } else {
      // For inactive version, edit in place
      setForm(versionToForm(v));
      setFormMode(v.id);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (formMode === 'create') {
        await centralConfigService.create(payload);
        addToast({ variant: 'success', message: t('centralConfig.createSuccess') });
      } else {
        await centralConfigService.update(formMode as string, payload);
        addToast({ variant: 'success', message: t('centralConfig.updateSuccess') });
      }
      setFormMode(null);
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

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('centralConfig.confirmDelete'))) return;
    try {
      await centralConfigService.remove(id);
      addToast({ variant: 'success', message: t('centralConfig.deleteSuccess') });
      await loadHistory();
    } catch {
      addToast({ variant: 'error', message: t('centralConfig.deleteError') });
    }
  };

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-3xl">
        <Icon name="spinner" size={24} color="var(--color-medium-gray)" />
      </div>
    );
  }

  const isFormOpen = formMode !== null;

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="font-mono text-small text-medium-gray">
          {versions.length} {t('centralConfig.versions')}
        </span>
        {!isFormOpen && (
          <Button variant="primary" onClick={openCreate}>
            <Icon name="plus" size={16} />
            {t('centralConfig.newVersion')}
          </Button>
        )}
      </div>

      {/* Form (create or edit) */}
      {isFormOpen && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="bg-surface px-xl py-md border-b border-border flex justify-between items-center">
            <h3 className="text-body font-semibold text-black m-0">
              {formMode === 'create' ? t('centralConfig.newVersion') : t('centralConfig.editVersion')}
            </h3>
          </div>

          <div className="p-xl">
            <SectionLabel label={t('centralConfig.weightRanges')} />
            <div className="grid grid-cols-2 gap-lg mb-xl">
              <RangeInput label={t('config.surface')} minVal={form.pSuperficieMin} maxVal={form.pSuperficieMax}
                onMinChange={(v) => updateForm('pSuperficieMin', v)} onMaxChange={(v) => updateForm('pSuperficieMax', v)} />
              <RangeInput label={t('config.zone')} minVal={form.pZonaMin} maxVal={form.pZonaMax}
                onMinChange={(v) => updateForm('pZonaMin', v)} onMaxChange={(v) => updateForm('pZonaMax', v)} />
              <RangeInput label={t('config.giro')} minVal={form.pGiroMin} maxVal={form.pGiroMax}
                onMinChange={(v) => updateForm('pGiroMin', v)} onMaxChange={(v) => updateForm('pGiroMax', v)} />
              <RangeInput label={t('config.type')} minVal={form.pTipoMin} maxVal={form.pTipoMax}
                onMinChange={(v) => updateForm('pTipoMin', v)} onMaxChange={(v) => updateForm('pTipoMax', v)} />
            </div>

            <SectionLabel label={t('centralConfig.controlParams')} />
            <div className="grid grid-cols-2 gap-lg mb-xl">
              <RangeInput label={t('centralConfig.zoneMultiplier')} minVal={form.zonaMultMin} maxVal={form.zonaMultMax}
                onMinChange={(v) => updateForm('zonaMultMin', v)} onMaxChange={(v) => updateForm('zonaMultMax', v)} />
              <RangeInput label={t('centralConfig.variationLimit')} minVal={form.variacionLimitMin} maxVal={form.variacionLimitMax}
                onMinChange={(v) => updateForm('variacionLimitMin', v)} onMaxChange={(v) => updateForm('variacionLimitMax', v)} />
            </div>

            <SectionLabel label={t('centralConfig.itdThresholds')} />
            <div className="grid grid-cols-2 gap-lg mb-xl">
              <Input label={t('centralConfig.thresholdProtegido')} type="number" value={form.itdThresholdProtegido}
                onChange={(e) => updateForm('itdThresholdProtegido', e.target.value)} />
              <Input label={t('centralConfig.thresholdProporcional')} type="number" value={form.itdThresholdProporcional}
                onChange={(e) => updateForm('itdThresholdProporcional', e.target.value)} />
            </div>

            <div className="mb-lg">
              <label className="block text-small font-medium text-dark-gray mb-xs">
                {t('config.justification')}
              </label>
              <textarea
                className="w-full min-h-[80px] border border-border rounded-sm p-sm text-small font-primary resize-y focus:outline-none focus:border-action-blue"
                value={form.justification}
                onChange={(e) => updateForm('justification', e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-sm">
              <Button variant="secondary" onClick={() => setFormMode(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Version Cards */}
      {versions.map((v) => (
        <VersionCard
          key={v.id}
          version={v}
          onActivate={handleActivate}
          onEdit={openEdit}
          onDelete={handleDelete}
          t={t}
        />
      ))}

      {versions.length === 0 && !isFormOpen && (
        <div className="bg-white border border-border rounded-lg p-3xl text-center">
          <div className="w-12 h-12 rounded-lg bg-surface mx-auto mb-md flex items-center justify-center">
            <Icon name="settings" size={24} color="var(--color-medium-gray)" />
          </div>
          <p className="text-body font-medium text-dark-gray mb-xs">{t('centralConfig.noVersions')}</p>
          <p className="text-small text-medium-gray">{t('centralConfig.noVersionsDesc')}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Version Card ─── */
function VersionCard({
  version: v,
  onActivate,
  onEdit,
  onDelete,
  t,
}: {
  version: CentralConfigVersion;
  onActivate: (id: string) => void;
  onEdit: (v: CentralConfigVersion) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}) {
  const protPct = (Number(v.itdThresholdProtegido) * 100).toFixed(0);
  const propPct = (Number(v.itdThresholdProporcional) * 100).toFixed(0);

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      {/* Card Header */}
      <div className="flex justify-between items-center px-xl py-md border-b border-border-light bg-surface">
        <div className="flex items-center gap-md">
          <span className="font-mono font-semibold text-body text-institutional-blue">v{v.version}</span>
          <StatusBadge
            status={v.active ? 'active' : 'inactive'}
            label={v.active ? t('centralConfig.active') : t('centralConfig.inactive')}
          />
        </div>
        <div className="flex items-center gap-md">
          <span className="text-caption text-light-gray">
            {new Date(v.createdAt).toLocaleDateString('es-MX', {
              year: 'numeric', month: 'short', day: 'numeric',
            })}
          </span>
          <Button variant="tertiary" onClick={() => onEdit(v)}>
            <Icon name="edit" size={14} />
            {v.active ? t('centralConfig.duplicate') : t('common.edit')}
          </Button>
          {!v.active && (
            <>
              <Button variant="secondary" onClick={() => onActivate(v.id)}>
                {t('centralConfig.activate')}
              </Button>
              <Button variant="tertiary" onClick={() => onDelete(v.id)}>
                <Icon name="trash" size={14} color="var(--color-error-red)" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="p-xl">
        {/* Weight Ranges Section */}
        <SectionLabel label={t('centralConfig.weightRanges')} />
        <div className="grid grid-cols-2 gap-x-xl gap-y-md mb-xl">
          <RangeBar label={t('config.surface')} min={v.pSuperficieMin} max={v.pSuperficieMax} scaleMax={0.5} format="pct" />
          <RangeBar label={t('config.zone')} min={v.pZonaMin} max={v.pZonaMax} scaleMax={0.5} format="pct" />
          <RangeBar label={t('config.giro')} min={v.pGiroMin} max={v.pGiroMax} scaleMax={0.5} format="pct" />
          <RangeBar label={t('config.type')} min={v.pTipoMin} max={v.pTipoMax} scaleMax={0.5} format="pct" />
        </div>

        {/* Control Parameters Section */}
        <SectionLabel label={t('centralConfig.controlParams')} />
        <div className="grid grid-cols-2 gap-x-xl gap-y-md mb-xl">
          <RangeBar label={t('centralConfig.zoneMultiplier')} min={v.zonaMultMin} max={v.zonaMultMax} scaleMax={3} format="decimal" />
          <RangeBar label={t('centralConfig.variationLimit')} min={v.variacionLimitMin} max={v.variacionLimitMax} scaleMax={1} format="pct" />
        </div>

        {/* ITD Thresholds - Visual Scale */}
        <SectionLabel label={t('centralConfig.itdThresholds')} />
        <div className="flex rounded-md overflow-hidden h-[36px] border border-border">
          <div
            className="bg-[#EBF5ED] flex items-center justify-center text-[#2C7A3E] text-caption font-medium"
            style={{ width: `${protPct}%` }}
          >
            {t('determination.protected')} &lt; {protPct}%
          </div>
          <div
            className="bg-[#FDF5E6] flex items-center justify-center text-[#C47F17] text-caption font-medium border-x border-border"
            style={{ width: `${Number(propPct) - Number(protPct)}%` }}
          >
            {t('determination.moderate')} {protPct}–{propPct}%
          </div>
          <div
            className="bg-[#F9EBEB] flex items-center justify-center text-[#A82C2C] text-caption font-medium"
            style={{ width: `${100 - Number(propPct)}%` }}
          >
            {t('determination.proportional')} &gt; {propPct}%
          </div>
        </div>

        {/* Justification */}
        {v.justification && (
          <div className="mt-xl pt-lg border-t border-border-light">
            <div className="flex items-start gap-sm">
              <Icon name="info" size={14} color="var(--color-medium-gray)" />
              <p className="text-small text-medium-gray leading-relaxed m-0">{v.justification}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shared Components ─── */

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-sm mb-md">
      <span className="text-caption font-semibold text-medium-gray uppercase tracking-[0.5px]">{label}</span>
      <div className="flex-1 h-px bg-border-light" />
    </div>
  );
}

function RangeBar({
  label, min, max, scaleMax, format,
}: {
  label: string; min: number; max: number; scaleMax: number; format: 'pct' | 'decimal';
}) {
  const minNum = Number(min);
  const maxNum = Number(max);
  const leftPct = (minNum / scaleMax) * 100;
  const widthPct = ((maxNum - minNum) / scaleMax) * 100;
  const fmt = (v: number) =>
    format === 'pct' ? `${(v * 100).toFixed(0)}%` : v.toFixed(2);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-[3px]">
        <span className="text-small text-dark-gray">{label}</span>
        <span className="font-mono text-small text-institutional-blue font-semibold">
          {fmt(minNum)} – {fmt(maxNum)}
        </span>
      </div>
      <div className="w-full h-[5px] bg-[#EBF0F5] rounded-full overflow-hidden relative">
        <div
          className="absolute h-full bg-action-blue rounded-full"
          style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 2)}%` }}
        />
      </div>
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
