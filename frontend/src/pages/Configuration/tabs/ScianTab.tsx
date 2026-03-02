import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { scianService } from '../../../services/scian.service';
import { useToast } from '../../../contexts/ToastContext';
import { Table } from '../../../components/ui/Table/Table';
import { StatusBadge } from '../../../components/ui/StatusBadge/StatusBadge';
import { Input } from '../../../components/ui/Input/Input';
import { Icon } from '../../../components/ui/Icon/Icon';
import type { ScianCode } from '../../../types/sdui.types';

export function ScianTab() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [codes, setCodes] = useState<ScianCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [impactoFilter, setImpactoFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadCodes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await scianService.list({
        page,
        limit: 20,
        search: search || undefined,
        impacto: impactoFilter || undefined,
      });
      setCodes(response.data);
      setTotalPages(response.meta.totalPages);
    } catch {
      addToast({ variant: 'error', message: t('config.scianLoadError') });
    } finally {
      setLoading(false);
    }
  }, [page, search, impactoFilter]);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  useEffect(() => {
    setPage(1);
  }, [search, impactoFilter]);

  const impactColor = (impact: string) => {
    if (impact === 'alto') return 'error';
    if (impact === 'medio') return 'warning';
    return 'active';
  };

  const columns = [
    {
      key: 'codigo',
      label: t('config.scianCode'),
      render: (s: ScianCode) => (
        <span className="font-mono font-semibold">{s.codigoScian}</span>
      ),
    },
    {
      key: 'descripcion',
      label: t('config.scianDescription'),
      render: (s: ScianCode) => (
        <span className="text-small">{s.descripcionScian}</span>
      ),
    },
    {
      key: 'impacto',
      label: t('config.impact'),
      render: (s: ScianCode) => (
        <StatusBadge status={impactColor(s.impactoSdui) as any} label={s.impactoSdui} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex gap-md items-end">
        <div className="flex-1">
          <Input
            label={t('config.searchScian')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('config.searchScianPlaceholder')}
          />
        </div>
        <div>
          <label className="block text-small text-medium-gray mb-xs">{t('config.filterImpact')}</label>
          <select
            className="border border-border rounded-sm px-md py-sm text-small bg-white min-w-[120px] h-[38px]"
            value={impactoFilter}
            onChange={(e) => setImpactoFilter(e.target.value)}
          >
            <option value="">{t('common.all')}</option>
            <option value="bajo">Bajo</option>
            <option value="medio">Medio</option>
            <option value="alto">Alto</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-medium-gray text-body p-xl text-center">{t('common.loading')}</div>
      ) : (
        <>
          <Table columns={columns} data={codes} rowKey={(s) => s.id} />

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
