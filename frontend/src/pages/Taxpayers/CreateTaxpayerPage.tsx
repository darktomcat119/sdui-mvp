import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { taxpayersService } from '../../services/taxpayers.service';
import { scianService } from '../../services/scian.service';
import { zonesService } from '../../services/zones.service';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import type { ScianCode, ZoneCatalog } from '../../types/sdui.types';

export function CreateTaxpayerPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [scianCodes, setScianCodes] = useState<ScianCode[]>([]);
  const [zones, setZones] = useState<ZoneCatalog[]>([]);

  const [form, setForm] = useState({
    razonSocial: '',
    tipoPersonalidad: 'fisica',
    rfc: '',
    curp: '',
    tipoTramite: 'renovacion',
    numeroLicencia: '',
    scianId: '',
    zoneId: '',
    tipoContribuyente: 'independiente',
    superficieM2: 0,
    cuotaVigente: 0,
    claveCatastral: '',
    usoSuelo: '',
    actividadRegulada: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [scianRes, zonesRes] = await Promise.all([
          scianService.list({ limit: 100 }),
          zonesService.listCatalog(),
        ]);
        setScianCodes(scianRes.data);
        setZones(zonesRes.data);
      } catch {
        addToast({ variant: 'error', message: t('taxpayers.loadDataError') });
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.razonSocial || !form.scianId || !form.zoneId || form.superficieM2 <= 0) {
      addToast({ variant: 'error', message: t('taxpayers.requiredFields') });
      return;
    }

    setSaving(true);
    try {
      await taxpayersService.create({
        ...form,
        rfc: form.rfc || undefined,
        curp: form.curp || undefined,
        numeroLicencia: form.numeroLicencia || undefined,
        claveCatastral: form.claveCatastral || undefined,
        usoSuelo: form.usoSuelo || undefined,
        actividadRegulada: form.actividadRegulada || undefined,
      });
      addToast({ variant: 'success', message: t('taxpayers.created') });
      navigate('/taxpayers');
    } catch (err: any) {
      addToast({
        variant: 'error',
        message: err.response?.data?.message || t('taxpayers.createError'),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-lg max-w-3xl">
      <div className="bg-white rounded-lg border border-border p-xl">
        <h3 className="text-subtitle font-semibold text-black m-0 mb-lg">
          {t('taxpayers.generalData')}
        </h3>

        <div className="grid grid-cols-2 gap-lg">
          <div className="col-span-2">
            <Input
              label={t('taxpayers.businessName')}
              required
              value={form.razonSocial}
              onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-small text-medium-gray mb-xs">{t('taxpayers.personalityType')}</label>
            <select
              className="w-full border border-border rounded-sm px-md py-sm text-small bg-white h-[38px]"
              value={form.tipoPersonalidad}
              onChange={(e) => setForm({ ...form, tipoPersonalidad: e.target.value })}
            >
              <option value="fisica">Persona Física</option>
              <option value="moral">Persona Moral</option>
            </select>
          </div>

          <div>
            <label className="block text-small text-medium-gray mb-xs">{t('taxpayers.processType')}</label>
            <select
              className="w-full border border-border rounded-sm px-md py-sm text-small bg-white h-[38px]"
              value={form.tipoTramite}
              onChange={(e) => setForm({ ...form, tipoTramite: e.target.value })}
            >
              <option value="apertura">Apertura</option>
              <option value="renovacion">Renovación</option>
            </select>
          </div>

          <Input
            label="RFC"
            value={form.rfc}
            onChange={(e) => setForm({ ...form, rfc: e.target.value })}
            maxLength={13}
          />

          <Input
            label="CURP"
            value={form.curp}
            onChange={(e) => setForm({ ...form, curp: e.target.value })}
            maxLength={18}
          />

          <Input
            label={t('taxpayers.licenseNumber')}
            value={form.numeroLicencia}
            onChange={(e) => setForm({ ...form, numeroLicencia: e.target.value })}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border p-xl">
        <h3 className="text-subtitle font-semibold text-black m-0 mb-lg">
          {t('taxpayers.businessData')}
        </h3>

        <div className="grid grid-cols-2 gap-lg">
          <div>
            <label className="block text-small text-medium-gray mb-xs">SCIAN *</label>
            <select
              className="w-full border border-border rounded-sm px-md py-sm text-small bg-white h-[38px]"
              value={form.scianId}
              onChange={(e) => setForm({ ...form, scianId: e.target.value })}
              required
            >
              <option value="">{t('taxpayers.selectScian')}</option>
              {scianCodes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigoScian} — {s.descripcionScian.slice(0, 50)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-small text-medium-gray mb-xs">{t('taxpayers.zone')} *</label>
            <select
              className="w-full border border-border rounded-sm px-md py-sm text-small bg-white h-[38px]"
              value={form.zoneId}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
              required
            >
              <option value="">{t('taxpayers.selectZone')}</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombreZona}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-small text-medium-gray mb-xs">{t('taxpayers.taxpayerType')} *</label>
            <select
              className="w-full border border-border rounded-sm px-md py-sm text-small bg-white h-[38px]"
              value={form.tipoContribuyente}
              onChange={(e) => setForm({ ...form, tipoContribuyente: e.target.value })}
            >
              <option value="independiente">Independiente</option>
              <option value="franquicia">Franquicia</option>
              <option value="cadena">Cadena</option>
            </select>
          </div>

          <Input
            label={`${t('taxpayers.surface')} (m²) *`}
            type="number"
            required
            min="0.01"
            step="0.01"
            value={form.superficieM2 || ''}
            onChange={(e) => setForm({ ...form, superficieM2: parseFloat(e.target.value) || 0 })}
          />

          <Input
            label={`${t('taxpayers.currentQuota')} ($) *`}
            type="number"
            required
            min="0"
            step="0.01"
            value={form.cuotaVigente || ''}
            onChange={(e) => setForm({ ...form, cuotaVigente: parseFloat(e.target.value) || 0 })}
          />

          <Input
            label={t('taxpayers.claveCatastral')}
            value={form.claveCatastral}
            onChange={(e) => setForm({ ...form, claveCatastral: e.target.value })}
            maxLength={50}
          />

          <Input
            label={t('taxpayers.usoSuelo')}
            value={form.usoSuelo}
            onChange={(e) => setForm({ ...form, usoSuelo: e.target.value })}
            maxLength={100}
          />

          <div className="col-span-2">
            <Input
              label={t('taxpayers.actividadRegulada')}
              value={form.actividadRegulada}
              onChange={(e) => setForm({ ...form, actividadRegulada: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-sm">
        <Button variant="primary" type="submit" disabled={saving}>
          {saving ? t('common.saving') : t('taxpayers.create')}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/taxpayers')}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  );
}
