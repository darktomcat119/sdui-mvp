import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auditService, type AuditQueryParams } from '../../services/audit.service';
import { useToast } from '../../contexts/ToastContext';
import type { AuditLog } from '../../types/api.types';
import { Table } from '../../components/ui/Table/Table';
import { Button } from '../../components/ui/Button/Button';
import { Icon } from '../../components/ui/Icon/Icon';

export function AuditLogPage() {
  const { t, i18n } = useTranslation();
  const { addToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [filters, setFilters] = useState<AuditQueryParams>({});

  useEffect(() => {
    let cancelled = false;
    const loadLogs = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await auditService.list({ ...filters, page, limit: 20 });
        if (!cancelled) {
          setLogs(response.data);
          setTotalPages(response.meta.totalPages);
          setTotal(response.meta.total);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading audit logs:', err);
          setError(true);
          addToast({ variant: 'error', message: t('audit.loadError') });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadLogs();
    return () => { cancelled = true; };
  }, [page, filters, retryCount]);

  const dateLocale = i18n.language === 'en' ? 'en-US' : 'es-MX';

  const columns = [
    {
      key: 'timestamp',
      label: t('audit.colTimestamp'),
      render: (log: AuditLog) =>
        new Date(log.timestamp).toLocaleString(dateLocale),
    },
    { key: 'userName', label: t('audit.colUser') },
    { key: 'userRole', label: t('audit.colRole') },
    { key: 'action', label: t('audit.colAction') },
    { key: 'module', label: t('audit.colModule') },
    {
      key: 'entityType',
      label: t('audit.colEntity'),
      render: (log: AuditLog) =>
        log.entityType ? `${log.entityType}` : '—',
    },
    {
      key: 'sourceIp',
      label: t('audit.colIp'),
      render: (log: AuditLog) => log.sourceIp || '—',
    },
  ];

  if (loading && logs.length === 0) {
    return <div className="text-medium-gray text-body p-3xl text-center">{t('audit.loadingLogs')}</div>;
  }

  if (error && logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-md p-3xl text-center">
        <span className="text-body text-medium-gray">{t('audit.loadError')}</span>
        <Button variant="secondary" onClick={() => setRetryCount((c) => c + 1)}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex items-center">
        <span className="text-small text-medium-gray">{t('audit.count', { count: total })}</span>
      </div>

      <div className="flex gap-md flex-wrap items-end p-lg bg-white border border-border rounded-md">
        <div className="flex items-center justify-center w-9 h-9 self-end text-medium-gray">
          <Icon name="filter" size={16} />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-caption font-medium text-medium-gray">{t('audit.filterModule')}</label>
          <select
            className="py-sm px-md border border-border rounded-sm font-primary text-small min-h-[36px] bg-white text-black transition-[border-color] duration-150 ease-in-out hover:border-medium-gray focus:outline-none focus:border-action-blue focus:border-2"
            value={filters.module || ''}
            onChange={(e) =>
              setFilters({ ...filters, module: e.target.value || undefined })
            }
          >
            <option value="">{t('audit.filterAll')}</option>
            <option value="auth">{t('audit.filterAuth')}</option>
            <option value="users">{t('audit.filterUsers')}</option>
            <option value="municipalities">{t('audit.filterMunicipalities')}</option>
          </select>
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-caption font-medium text-medium-gray">{t('audit.filterFrom')}</label>
          <input
            className="py-sm px-md border border-border rounded-sm font-primary text-small min-h-[36px] bg-white text-black transition-[border-color] duration-150 ease-in-out hover:border-medium-gray focus:outline-none focus:border-action-blue focus:border-2"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) =>
              setFilters({ ...filters, dateFrom: e.target.value || undefined })
            }
          />
        </div>
        <div className="flex flex-col gap-xs">
          <label className="text-caption font-medium text-medium-gray">{t('audit.filterTo')}</label>
          <input
            className="py-sm px-md border border-border rounded-sm font-primary text-small min-h-[36px] bg-white text-black transition-[border-color] duration-150 ease-in-out hover:border-medium-gray focus:outline-none focus:border-action-blue focus:border-2"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) =>
              setFilters({ ...filters, dateTo: e.target.value || undefined })
            }
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setFilters({});
            setPage(1);
          }}
        >
          {t('common.clear')}
        </Button>
      </div>

      <Table columns={columns} data={logs} rowKey={(log) => log.id} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-sm">
          <button
            className="inline-flex items-center gap-xs py-sm px-lg border border-border rounded-sm bg-white cursor-pointer font-primary text-small text-dark-gray transition-all duration-150 ease-in-out hover:bg-surface-hover hover:text-action-blue hover:border-action-blue disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="inline-flex items-center gap-xs py-sm px-lg border border-border rounded-sm bg-white cursor-pointer font-primary text-small text-dark-gray transition-all duration-150 ease-in-out hover:bg-surface-hover hover:text-action-blue hover:border-action-blue disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t('common.next')}
            <Icon name="chevronRight" size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
