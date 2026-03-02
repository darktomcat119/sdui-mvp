import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { reportsService } from '../../services/reports.service';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button/Button';
import { Icon } from '../../components/ui/Icon/Icon';
import type { ExecutiveSummary } from '../../types/sdui.types';

export function ReportsPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const response = await reportsService.getExecutiveSummary();
      setSummary(response.data);
    } catch {
      addToast({ variant: 'error', message: t('reports.loadError') });
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await reportsService.exportCsv();
      reportsService.downloadBlob(
        blob,
        `determinaciones_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      addToast({ variant: 'success', message: t('reports.exportSuccess') });
    } catch {
      addToast({ variant: 'error', message: t('reports.exportError') });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="text-medium-gray text-body p-xl text-center">{t('common.loading')}</div>;
  }

  if (!summary || summary.totalDeterminaciones === 0) {
    return (
      <div className="text-center p-3xl text-medium-gray text-body">
        {t('reports.noData')}
      </div>
    );
  }

  const { byClasificacion } = summary;
  const totalD = summary.totalDeterminaciones;

  return (
    <div className="flex flex-col gap-[20px]">
      {/* Export Actions */}
      <div className="flex justify-end gap-sm">
        <Button variant="secondary" onClick={handleExportCsv} disabled={exporting}>
          <Icon name="download" size={18} />
          {exporting ? t('reports.exporting') : t('reports.exportCsv')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-md">
        <KpiCard
          label={t('reports.totalTaxpayers')}
          value={summary.totalContribuyentes.toString()}
        />
        <KpiCard
          label={t('reports.totalDeterminations')}
          value={totalD.toString()}
        />
        <KpiCard
          label={t('reports.avgImpact')}
          value={`${(summary.promedioImpacto * 100).toFixed(2)}%`}
        />
        <KpiCard
          label={t('reports.maxImpact')}
          value={`${(summary.impactoMaximo * 100).toFixed(2)}%`}
        />
        <KpiCard
          label={t('reports.limit')}
          value={summary.limiteAplicado ? `${(summary.limiteAplicado * 100).toFixed(0)}%` : '—'}
        />
      </div>

      {/* Classification Distribution */}
      <div className="bg-white rounded-lg border border-border p-xl">
        <h3 className="text-subtitle font-semibold text-black m-0 mb-lg">
          {t('reports.classificationDistribution')}
        </h3>
        <div className="grid grid-cols-3 gap-lg">
          <ClassificationBar
            label={t('determination.protected')}
            count={byClasificacion.protegido}
            total={totalD}
            color="bg-green-500"
          />
          <ClassificationBar
            label={t('determination.moderate')}
            count={byClasificacion.moderado}
            total={totalD}
            color="bg-amber-500"
          />
          <ClassificationBar
            label={t('determination.proportional')}
            count={byClasificacion.proporcional}
            total={totalD}
            color="bg-red-500"
          />
        </div>
      </div>

      {/* Distribution by Zone */}
      {summary.distribucionZonas.length > 0 && (
        <div className="bg-white rounded-lg border border-border p-xl">
          <h3 className="text-subtitle font-semibold text-black m-0 mb-lg">
            {t('reports.zoneDistribution')}
          </h3>
          <div className="flex flex-col gap-sm">
            {summary.distribucionZonas.map((z) => (
              <div key={z.zona} className="flex items-center justify-between py-xs border-b border-border-light last:border-0">
                <span className="text-small text-dark-gray">{z.zona}</span>
                <span className="font-mono text-small font-semibold">{z.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distribution by Giro */}
      {summary.distribucionGiros.length > 0 && (
        <div className="bg-white rounded-lg border border-border p-xl">
          <h3 className="text-subtitle font-semibold text-black m-0 mb-lg">
            {t('reports.giroDistribution')}
          </h3>
          <div className="flex flex-col gap-sm">
            {summary.distribucionGiros.map((g) => (
              <div key={g.giro} className="flex items-center justify-between py-xs border-b border-border-light last:border-0">
                <span className="text-small text-dark-gray">{g.giro}</span>
                <span className="font-mono text-small font-semibold">{g.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-border p-lg text-center">
      <span className="text-small text-medium-gray">{label}</span>
      <p className="text-heading font-bold text-black mt-xs mb-0">{value}</p>
    </div>
  );
}

function ClassificationBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between mb-xs">
        <span className="text-small font-medium text-dark-gray">{label}</span>
        <span className="text-small text-medium-gray">{count} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
