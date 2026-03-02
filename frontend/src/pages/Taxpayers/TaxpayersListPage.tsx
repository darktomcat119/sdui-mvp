import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { taxpayersService } from '../../services/taxpayers.service';
import { useToast } from '../../contexts/ToastContext';
import { Table } from '../../components/ui/Table/Table';
import { StatusBadge } from '../../components/ui/StatusBadge/StatusBadge';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Icon } from '../../components/ui/Icon/Icon';
import type { Taxpayer, BulkUploadResult } from '../../types/sdui.types';

export function TaxpayersListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [taxpayers, setTaxpayers] = useState<Taxpayer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await taxpayersService.list({
        page,
        limit: 20,
        search: search || undefined,
        tipoContribuyente: tipoFilter || undefined,
        estatus: estatusFilter || undefined,
      });
      setTaxpayers(response.data);
      setTotalPages(response.meta.totalPages);
      setTotal(response.meta.total);
    } catch {
      addToast({ variant: 'error', message: t('taxpayers.loadError') });
    } finally {
      setLoading(false);
    }
  }, [page, search, tipoFilter, estatusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, tipoFilter, estatusFilter]);

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const response = await taxpayersService.bulkUpload(file);
      const result = response.data;
      addToast({
        variant: result.errors.length > 0 ? 'warning' : 'success',
        message: `${t('taxpayers.uploadResult')}: ${result.created} ${t('taxpayers.created')}${result.errors.length > 0 ? `, ${result.errors.length} ${t('taxpayers.errors')}` : ''}`,
      });
      await load();
    } catch (err: any) {
      addToast({
        variant: 'error',
        message: err.response?.data?.message || t('taxpayers.uploadError'),
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const tipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      independiente: 'Independiente',
      franquicia: 'Franquicia',
      cadena: 'Cadena',
    };
    return labels[tipo] || tipo;
  };

  const columns = [
    {
      key: 'razonSocial',
      label: t('taxpayers.colName'),
      render: (tp: Taxpayer) => (
        <span className="font-medium">{tp.razonSocial}</span>
      ),
    },
    {
      key: 'rfc',
      label: 'RFC',
      render: (tp: Taxpayer) => (
        <span className="font-mono text-small">{tp.rfc || '—'}</span>
      ),
    },
    {
      key: 'scian',
      label: 'SCIAN',
      render: (tp: Taxpayer) => (
        <span className="text-small">
          {tp.scian?.codigoScian} — {tp.scian?.descripcionScian?.slice(0, 30)}
        </span>
      ),
    },
    {
      key: 'zona',
      label: t('taxpayers.colZone'),
      render: (tp: Taxpayer) => tp.zone?.nombreZona || '—',
    },
    {
      key: 'tipo',
      label: t('taxpayers.colType'),
      render: (tp: Taxpayer) => tipoLabel(tp.tipoContribuyente),
    },
    {
      key: 'superficie',
      label: 'm²',
      render: (tp: Taxpayer) => (
        <span className="font-mono text-small">{Number(tp.superficieM2).toLocaleString()}</span>
      ),
    },
    {
      key: 'cuota',
      label: t('taxpayers.colQuota'),
      render: (tp: Taxpayer) => (
        <span className="font-mono text-small">${Number(tp.cuotaVigente).toLocaleString()}</span>
      ),
    },
    {
      key: 'estatus',
      label: t('taxpayers.colStatus'),
      render: (tp: Taxpayer) => (
        <StatusBadge status={tp.estatus === 'activo' ? 'active' : 'inactive'} label={tp.estatus} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex justify-between items-center">
        <span className="text-small text-medium-gray">
          {t('taxpayers.count', { count: total })}
        </span>
        <div className="flex gap-sm">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleBulkUpload}
          />
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Icon name="upload" size={18} />
            {uploading ? t('taxpayers.uploading') : t('taxpayers.bulkUpload')}
          </Button>
          <Button variant="primary" onClick={() => navigate('/taxpayers/new')}>
            <Icon name="plus" size={18} />
            {t('taxpayers.newTaxpayer')}
          </Button>
        </div>
      </div>

      <div className="flex gap-md items-end">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('taxpayers.searchPlaceholder')}
          />
        </div>
        <select
          className="border border-border rounded-sm px-md py-sm text-small bg-white h-[38px]"
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value)}
        >
          <option value="">{t('taxpayers.allTypes')}</option>
          <option value="independiente">Independiente</option>
          <option value="franquicia">Franquicia</option>
          <option value="cadena">Cadena</option>
        </select>
        <select
          className="border border-border rounded-sm px-md py-sm text-small bg-white h-[38px]"
          value={estatusFilter}
          onChange={(e) => setEstatusFilter(e.target.value)}
        >
          <option value="">{t('taxpayers.allStatuses')}</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="suspendido">Suspendido</option>
        </select>
      </div>

      {loading ? (
        <div className="text-medium-gray text-body p-xl text-center">{t('common.loading')}</div>
      ) : (
        <>
          <Table columns={columns} data={taxpayers} rowKey={(tp) => tp.id} />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-sm">
              <button
                className="inline-flex items-center gap-xs py-sm px-lg border border-border rounded-sm bg-white cursor-pointer font-primary text-small text-dark-gray transition-all duration-150 hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <Icon name="chevronLeft" size={16} />
                {t('common.previous')}
              </button>
              <span className="px-md text-small text-medium-gray">
                {t('common.pageOf', { page, total: totalPages })}
              </span>
              <button
                className="inline-flex items-center gap-xs py-sm px-lg border border-border rounded-sm bg-white cursor-pointer font-primary text-small text-dark-gray transition-all duration-150 hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                {t('common.next')}
                <Icon name="chevronRight" size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
