import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { zonesService } from '../../../services/zones.service';
import { useToast } from '../../../contexts/ToastContext';
import { Table } from '../../../components/ui/Table/Table';
import { StatusBadge } from '../../../components/ui/StatusBadge/StatusBadge';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import type { MunicipalityZone } from '../../../types/sdui.types';

export function ZonesTab() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [zones, setZones] = useState<MunicipalityZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nivelDemanda: '', multiplicador: 0, justificacion: '' });

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setLoading(true);
    try {
      const response = await zonesService.listMunicipalityZones();
      setZones(response.data);
    } catch {
      addToast({ variant: 'error', message: t('config.zonesLoadError') });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (zone: MunicipalityZone) => {
    setEditingId(zone.id);
    setEditForm({
      nivelDemanda: zone.nivelDemanda,
      multiplicador: Number(zone.multiplicador),
      justificacion: '',
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await zonesService.updateMunicipalityZone(editingId, editForm);
      addToast({ variant: 'success', message: t('config.zoneSaved') });
      setEditingId(null);
      await loadZones();
    } catch (err: any) {
      addToast({
        variant: 'error',
        message: err.response?.data?.message || t('config.zoneError'),
      });
    }
  };

  const demandaColor = (d: string) => {
    if (d === 'alta') return 'active';
    if (d === 'media') return 'warning';
    return 'inactive';
  };

  const columns = [
    {
      key: 'zone',
      label: t('config.zoneName'),
      render: (mz: MunicipalityZone) => mz.zone?.nombreZona || '—',
    },
    {
      key: 'code',
      label: t('config.zoneCode'),
      render: (mz: MunicipalityZone) => mz.zone?.codigoZona || '—',
    },
    {
      key: 'demanda',
      label: t('config.demandLevel'),
      render: (mz: MunicipalityZone) =>
        editingId === mz.id ? (
          <select
            className="border border-border rounded-sm px-sm py-xs text-small"
            value={editForm.nivelDemanda}
            onChange={(e) => setEditForm({ ...editForm, nivelDemanda: e.target.value })}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
        ) : (
          <StatusBadge status={demandaColor(mz.nivelDemanda) as any} label={mz.nivelDemanda} />
        ),
    },
    {
      key: 'multiplicador',
      label: t('config.multiplier'),
      render: (mz: MunicipalityZone) =>
        editingId === mz.id ? (
          <Input
            type="number"
            step="0.05"
            min="0.60"
            max="1.50"
            value={editForm.multiplicador}
            onChange={(e) => setEditForm({ ...editForm, multiplicador: parseFloat(e.target.value) || 0 })}
          />
        ) : (
          <span className="font-mono text-small">{Number(mz.multiplicador).toFixed(2)}</span>
        ),
    },
    {
      key: 'actions',
      label: '',
      render: (mz: MunicipalityZone) =>
        editingId === mz.id ? (
          <div className="flex gap-xs">
            <Button variant="primary" onClick={saveEdit}>{t('common.save')}</Button>
            <Button variant="secondary" onClick={() => setEditingId(null)}>{t('common.cancel')}</Button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => startEdit(mz)}>{t('common.edit')}</Button>
        ),
    },
  ];

  if (loading) {
    return <div className="text-medium-gray text-body p-xl text-center">{t('common.loading')}</div>;
  }

  if (zones.length === 0) {
    return (
      <div className="text-center p-3xl text-medium-gray text-body">
        {t('config.noZonesConfigured')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <Table columns={columns} data={zones} rowKey={(mz) => mz.id} />
    </div>
  );
}
