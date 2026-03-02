import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { determinationsService } from '../../services/determinations.service';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { Table } from '../../components/ui/Table/Table';
import { StatusBadge } from '../../components/ui/StatusBadge/StatusBadge';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Icon } from '../../components/ui/Icon/Icon';
import type { Determination } from '../../types/sdui.types';

export function DeterminationPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [determinations, setDeterminations] = useState<Determination[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [clasificacionFilter, setClasificacionFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Summary cards
  const [summary, setSummary] = useState<{
    protegido: number;
    moderado: number;
    proporcional: number;
    total: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        determinationsService.list({
          page,
          limit: 20,
          clasificacion: clasificacionFilter || undefined,
          estatus: estatusFilter || undefined,
          search: search || undefined,
        }),
        determinationsService.getSummary(),
      ]);
      setDeterminations(listRes.data);
      setTotalPages(listRes.meta.totalPages);
      setTotal(listRes.meta.total);

      const s = summaryRes.data;
      const byClasMap: Record<string, number> = {};
      for (const item of s.byClasificacion) {
        byClasMap[item.clasificacion] = parseInt(item.count);
      }
      setSummary({
        total: s.total,
        protegido: byClasMap['protegido'] || 0,
        moderado: byClasMap['moderado'] || 0,
        proporcional: byClasMap['proporcional'] || 0,
      });
    } catch {
      // Summary may fail if no determinations yet
    } finally {
      setLoading(false);
    }
  }, [page, clasificacionFilter, estatusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [clasificacionFilter, estatusFilter, search]);

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const response = await determinationsService.execute();
      addToast({
        variant: 'success',
        message: `${t('determination.executed')}: ${response.data.total} ${t('determination.taxpayers')}`,
      });
      await load();
    } catch (err: any) {
      addToast({
        variant: 'error',
        message: err.response?.data?.message || t('determination.executeError'),
      });
    } finally {
      setExecuting(false);
    }
  };

  const clasificacionColor = (c: string) => {
    if (c === 'protegido') return 'active';
    if (c === 'moderado') return 'warning';
    return 'error';
  };

  const estatusColor = (e: string) => {
    if (e === 'aprobada') return 'active';
    if (e === 'calculada') return 'info';
    if (e === 'bloqueada') return 'error';
    return 'warning';
  };

  const isMunicipalAdmin = user?.role === 'municipal_admin';

  const columns = [
    {
      key: 'taxpayer',
      label: t('determination.colTaxpayer'),
      render: (d: Determination) => (
        <span className="font-medium">{d.taxpayer?.razonSocial || '—'}</span>
      ),
    },
    {
      key: 'itd',
      label: 'ITD',
      render: (d: Determination) => (
        <span className="font-mono font-semibold">{Number(d.itd).toFixed(4)}</span>
      ),
    },
    {
      key: 'clasificacion',
      label: t('determination.colClassification'),
      render: (d: Determination) => (
        <StatusBadge status={clasificacionColor(d.clasificacion) as any} label={d.clasificacion} />
      ),
    },
    {
      key: 'cuotaVigente',
      label: t('determination.colCurrentQuota'),
      render: (d: Determination) => (
        <span className="font-mono text-small">${Number(d.cuotaVigente).toLocaleString()}</span>
      ),
    },
    {
      key: 'cuotaSdui',
      label: t('determination.colSduiQuota'),
      render: (d: Determination) => (
        <span className="font-mono text-small font-semibold">${Number(d.cuotaSdui).toLocaleString()}</span>
      ),
    },
    {
      key: 'variacion',
      label: t('determination.colVariation'),
      render: (d: Determination) => {
        const pct = Number(d.variacionPct) * 100;
        return (
          <span className={`font-mono text-small ${pct > 0 ? 'text-red-600' : 'text-green-700'}`}>
            {pct > 0 ? '+' : ''}{pct.toFixed(2)}%
          </span>
        );
      },
    },
    {
      key: 'estatus',
      label: t('determination.colStatus'),
      render: (d: Determination) => (
        <StatusBadge status={estatusColor(d.estatus) as any} label={d.estatus} />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Summary Cards */}
      {summary && summary.total > 0 && (
        <div className="grid grid-cols-4 gap-md">
          <SummaryCard
            label={t('determination.total')}
            value={summary.total}
            color="text-black"
          />
          <SummaryCard
            label={t('determination.protected')}
            value={summary.protegido}
            color="text-green-700"
            pct={summary.total > 0 ? (summary.protegido / summary.total * 100).toFixed(0) : '0'}
          />
          <SummaryCard
            label={t('determination.moderate')}
            value={summary.moderado}
            color="text-amber-600"
            pct={summary.total > 0 ? (summary.moderado / summary.total * 100).toFixed(0) : '0'}
          />
          <SummaryCard
            label={t('determination.proportional')}
            value={summary.proporcional}
            color="text-red-600"
            pct={summary.total > 0 ? (summary.proporcional / summary.total * 100).toFixed(0) : '0'}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <span className="text-small text-medium-gray">
          {total} {t('determination.results')}
        </span>
        {isMunicipalAdmin && (
          <Button variant="primary" onClick={handleExecute} disabled={executing}>
            <Icon name="play" size={18} />
            {executing ? t('determination.executing') : t('determination.execute')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-md items-end">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('determination.searchPlaceholder')}
          />
        </div>
        <select
          className="border border-border rounded-sm px-md py-sm text-small bg-white h-[38px]"
          value={clasificacionFilter}
          onChange={(e) => setClasificacionFilter(e.target.value)}
        >
          <option value="">{t('determination.allClassifications')}</option>
          <option value="protegido">Protegido</option>
          <option value="moderado">Moderado</option>
          <option value="proporcional">Proporcional</option>
        </select>
        <select
          className="border border-border rounded-sm px-md py-sm text-small bg-white h-[38px]"
          value={estatusFilter}
          onChange={(e) => setEstatusFilter(e.target.value)}
        >
          <option value="">{t('determination.allStatuses')}</option>
          <option value="calculada">Calculada</option>
          <option value="aprobada">Aprobada</option>
          <option value="bloqueada">Bloqueada</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-medium-gray text-body p-xl text-center">{t('common.loading')}</div>
      ) : determinations.length === 0 ? (
        <div className="text-center p-3xl text-medium-gray text-body">
          {t('determination.noResults')}
        </div>
      ) : (
        <>
          <Table columns={columns} data={determinations} rowKey={(d) => d.id} onRowClick={(d) => navigate(`/determinations/${d.id}`)} />

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

function SummaryCard({
  label,
  value,
  color,
  pct,
}: {
  label: string;
  value: number;
  color: string;
  pct?: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-border p-lg">
      <span className="text-small text-medium-gray">{label}</span>
      <p className={`text-heading font-bold ${color} mt-xs mb-0`}>{value}</p>
      {pct && <span className="text-caption text-light-gray">{pct}%</span>}
    </div>
  );
}
