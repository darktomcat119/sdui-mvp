import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { determinationsService } from '../../services/determinations.service';
import { useToast } from '../../contexts/ToastContext';
import { Table } from '../../components/ui/Table/Table';
import { StatusBadge } from '../../components/ui/StatusBadge/StatusBadge';
import { Button } from '../../components/ui/Button/Button';
import { Icon } from '../../components/ui/Icon/Icon';
import type { LimitException } from '../../types/sdui.types';

export function ExceptionsPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();

  const [exceptions, setExceptions] = useState<LimitException[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Resolution modal state
  const [resolving, setResolving] = useState<LimitException | null>(null);
  const [resolutionOption, setResolutionOption] = useState<'APROBAR' | 'RECHAZAR' | 'ESCALAR'>('APROBAR');
  const [justificacion, setJustificacion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await determinationsService.listExceptions(page, 20);
      setExceptions(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      addToast({ variant: 'error', message: t('exceptions.loadError') });
    } finally {
      setLoading(false);
    }
  }, [page, addToast, t]);

  useEffect(() => {
    load();
  }, [load]);

  const openResolveModal = (exc: LimitException) => {
    setResolving(exc);
    setResolutionOption('APROBAR');
    setJustificacion('');
  };

  const handleResolve = async () => {
    if (!resolving) return;
    if (justificacion.length < 500) {
      addToast({ variant: 'error', message: t('exceptions.justificationMinLength') });
      return;
    }

    setSubmitting(true);
    try {
      await determinationsService.resolveException(resolving.id, {
        resolutionOption,
        justificacion,
      });
      addToast({ variant: 'success', message: t('exceptions.resolveSuccess') });
      setResolving(null);
      await load();
    } catch {
      addToast({ variant: 'error', message: t('exceptions.resolveError') });
    } finally {
      setSubmitting(false);
    }
  };

  const estatusColor = (e: string) => {
    if (e === 'aprobada') return 'active';
    if (e === 'rechazada') return 'error';
    if (e === 'escalada') return 'warning';
    return 'info';
  };

  const columns = [
    {
      key: 'folio',
      label: t('exceptions.colFolio'),
      render: (e: LimitException) => (
        <span className="font-mono text-small font-semibold">{e.folio || '—'}</span>
      ),
    },
    {
      key: 'taxpayer',
      label: t('exceptions.colTaxpayer'),
      render: (e: LimitException) => (
        <span className="font-medium">{e.determination?.taxpayer?.razonSocial || '—'}</span>
      ),
    },
    {
      key: 'variation',
      label: t('exceptions.colVariation'),
      render: (e: LimitException) => {
        const pct = e.determination ? Number(e.determination.variacionPct) * 100 : 0;
        return <span className="font-mono text-small text-red-600">+{pct.toFixed(2)}%</span>;
      },
    },
    {
      key: 'limit',
      label: t('exceptions.colLimit'),
      render: (e: LimitException) => (
        <span className="font-mono text-small">{(Number(e.limitePct) * 100).toFixed(0)}%</span>
      ),
    },
    {
      key: 'estatus',
      label: t('exceptions.colStatus'),
      render: (e: LimitException) => (
        <StatusBadge status={estatusColor(e.estatus) as any} label={e.estatus} />
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (e: LimitException) =>
        e.estatus === 'pendiente' ? (
          <Button variant="secondary" onClick={() => openResolveModal(e)}>
            {t('exceptions.resolve')}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex justify-between items-center">
        <span className="text-small text-medium-gray">
          {total} {t('exceptions.results')}
        </span>
      </div>

      {loading ? (
        <div className="text-medium-gray text-body p-xl text-center">{t('common.loading')}</div>
      ) : exceptions.length === 0 ? (
        <div className="text-center p-3xl text-medium-gray text-body">
          {t('exceptions.noResults')}
        </div>
      ) : (
        <>
          <Table columns={columns} data={exceptions} rowKey={(e) => e.id} />

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

      {/* Resolution Modal */}
      {resolving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg border border-border w-[600px] max-h-[90vh] overflow-y-auto p-xl">
            <div className="flex justify-between items-center mb-lg">
              <h3 className="text-subtitle font-semibold text-black m-0">
                {t('exceptions.resolveTitle')}
              </h3>
              <button
                className="text-medium-gray hover:text-dark-gray bg-transparent border-none cursor-pointer"
                onClick={() => setResolving(null)}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="mb-md">
              <p className="text-small text-medium-gray mb-xs">{t('exceptions.colFolio')}</p>
              <p className="text-body font-mono font-semibold">{resolving.folio}</p>
            </div>
            <div className="mb-md">
              <p className="text-small text-medium-gray mb-xs">{t('exceptions.colTaxpayer')}</p>
              <p className="text-body font-medium">{resolving.determination?.taxpayer?.razonSocial}</p>
            </div>
            <div className="mb-lg">
              <p className="text-small text-medium-gray mb-xs">{t('exceptions.motivo')}</p>
              <p className="text-small text-dark-gray">{resolving.motivo}</p>
            </div>

            <div className="mb-md">
              <p className="text-small font-semibold text-dark-gray mb-sm">{t('exceptions.resolutionOption')}</p>
              <div className="flex gap-md">
                {(['APROBAR', 'RECHAZAR', 'ESCALAR'] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-xs cursor-pointer text-small">
                    <input
                      type="radio"
                      name="resolution"
                      checked={resolutionOption === opt}
                      onChange={() => setResolutionOption(opt)}
                      className="cursor-pointer"
                    />
                    {t(`exceptions.option${opt.charAt(0) + opt.slice(1).toLowerCase()}`)}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-md">
              <label className="block text-small font-semibold text-dark-gray mb-xs">
                {t('exceptions.justification')} ({justificacion.length}/500)
              </label>
              <textarea
                className="w-full min-h-[120px] border border-border rounded-sm p-sm text-small font-primary resize-y"
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                placeholder={t('exceptions.justificationPlaceholder')}
              />
              {justificacion.length > 0 && justificacion.length < 500 && (
                <p className="text-caption text-red-600 mt-xs">
                  {t('exceptions.justificationMinLength')}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-sm">
              <Button variant="secondary" onClick={() => setResolving(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleResolve}
                disabled={submitting || justificacion.length < 500}
              >
                {submitting ? t('common.saving') : t('exceptions.confirm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
