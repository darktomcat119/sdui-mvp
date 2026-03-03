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
    return (
      <div className="flex items-center justify-center py-3xl">
        <Icon name="spinner" size={24} color="var(--color-medium-gray)" />
      </div>
    );
  }

  if (!summary || summary.totalDeterminaciones === 0) {
    return (
      <div className="bg-white border border-border rounded-lg p-3xl text-center">
        <div className="w-12 h-12 rounded-lg bg-surface mx-auto mb-md flex items-center justify-center">
          <Icon name="download" size={24} color="var(--color-medium-gray)" />
        </div>
        <p className="text-body text-dark-gray mb-xs">{t('reports.noData')}</p>
      </div>
    );
  }

  const { byClasificacion } = summary;
  const totalD = summary.totalDeterminaciones;

  return (
    <div className="flex flex-col gap-lg">
      {/* Export Actions */}
      <div className="flex justify-end">
        <Button variant="secondary" onClick={handleExportCsv} disabled={exporting}>
          <Icon name="download" size={16} />
          {exporting ? t('reports.exporting') : t('reports.exportCsv')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-md">
        <KpiCard label={t('reports.totalTaxpayers')} value={summary.totalContribuyentes.toString()} accent="#0066CC" />
        <KpiCard label={t('reports.totalDeterminations')} value={totalD.toString()} accent="#2C7A3E" />
        <KpiCard label={t('reports.avgImpact')} value={`${(summary.promedioImpacto * 100).toFixed(2)}%`} accent="#C47F17" />
        <KpiCard label={t('reports.maxImpact')} value={`${(summary.impactoMaximo * 100).toFixed(2)}%`} accent="#A82C2C" />
        <KpiCard label={t('reports.limit')} value={summary.limiteAplicado ? `${(summary.limiteAplicado * 100).toFixed(0)}%` : '—'} accent="#1E3A5F" />
      </div>

      {/* Classification Distribution */}
      <div className="bg-white rounded-lg border border-border overflow-hidden">
        <div className="px-xl py-md border-b border-border-light">
          <h3 className="text-body font-semibold text-black m-0">
            {t('reports.classificationDistribution')}
          </h3>
        </div>
        <div className="p-xl">
          {/* Stacked bar */}
          <div className="flex rounded-md overflow-hidden h-[24px] mb-lg">
            {byClasificacion.protegido > 0 && (
              <div
                className="bg-[#2C7A3E] flex items-center justify-center text-white text-[11px] font-medium"
                style={{ width: `${(byClasificacion.protegido / totalD) * 100}%` }}
              >
                {byClasificacion.protegido}
              </div>
            )}
            {byClasificacion.moderado > 0 && (
              <div
                className="bg-[#C47F17] flex items-center justify-center text-white text-[11px] font-medium"
                style={{ width: `${(byClasificacion.moderado / totalD) * 100}%` }}
              >
                {byClasificacion.moderado}
              </div>
            )}
            {byClasificacion.proporcional > 0 && (
              <div
                className="bg-[#A82C2C] flex items-center justify-center text-white text-[11px] font-medium"
                style={{ width: `${(byClasificacion.proporcional / totalD) * 100}%` }}
              >
                {byClasificacion.proporcional}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-lg">
            <ClassItem label={t('determination.protected')} count={byClasificacion.protegido} total={totalD} color="#2C7A3E" bg="#EBF5ED" />
            <ClassItem label={t('determination.moderate')} count={byClasificacion.moderado} total={totalD} color="#C47F17" bg="#FDF5E6" />
            <ClassItem label={t('determination.proportional')} count={byClasificacion.proporcional} total={totalD} color="#A82C2C" bg="#F9EBEB" />
          </div>
        </div>
      </div>

      {/* Distribution sections side by side */}
      <div className="grid grid-cols-2 gap-lg">
        {/* Zone Distribution */}
        {summary.distribucionZonas.length > 0 && (
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="px-xl py-md border-b border-border-light">
              <h3 className="text-body font-semibold text-black m-0">{t('reports.zoneDistribution')}</h3>
            </div>
            <div className="p-xl">
              <div className="flex flex-col">
                {summary.distribucionZonas.map((z) => {
                  const maxCount = Math.max(...summary.distribucionZonas.map((x) => x.count));
                  const barPct = maxCount > 0 ? (z.count / maxCount) * 100 : 0;
                  return (
                    <div key={z.zona} className="flex items-center gap-md py-sm border-b border-border-light last:border-0">
                      <span className="text-small text-dark-gray w-[120px] shrink-0 truncate">{z.zona}</span>
                      <div className="flex-1 h-[6px] bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-action-blue rounded-full" style={{ width: `${barPct}%` }} />
                      </div>
                      <span className="font-mono text-small font-semibold text-institutional-blue w-[30px] text-right">{z.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Giro Distribution */}
        {summary.distribucionGiros.length > 0 && (
          <div className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="px-xl py-md border-b border-border-light">
              <h3 className="text-body font-semibold text-black m-0">{t('reports.giroDistribution')}</h3>
            </div>
            <div className="p-xl">
              <div className="flex flex-col">
                {summary.distribucionGiros.map((g) => {
                  const maxCount = Math.max(...summary.distribucionGiros.map((x) => x.count));
                  const barPct = maxCount > 0 ? (g.count / maxCount) * 100 : 0;
                  return (
                    <div key={g.giro} className="flex items-center gap-md py-sm border-b border-border-light last:border-0">
                      <span className="text-small text-dark-gray w-[160px] shrink-0 truncate">{g.giro}</span>
                      <div className="flex-1 h-[6px] bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-[#C47F17] rounded-full" style={{ width: `${barPct}%` }} />
                      </div>
                      <span className="font-mono text-small font-semibold text-[#C47F17] w-[30px] text-right">{g.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      className="bg-white rounded-lg border border-border p-lg border-l-[3px]"
      style={{ borderLeftColor: accent }}
    >
      <span className="text-caption text-medium-gray uppercase tracking-[0.3px]">{label}</span>
      <p className="text-[20px] font-bold font-mono mt-xs mb-0" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function ClassItem({ label, count, total, color, bg }: {
  label: string; count: number; total: number; color: string; bg: string;
}) {
  const pct = total > 0 ? (count / total * 100) : 0;
  return (
    <div className="flex items-center gap-md p-md rounded-md" style={{ backgroundColor: bg }}>
      <div className="text-[20px] font-bold font-mono leading-none" style={{ color }}>
        {count}
      </div>
      <div>
        <span className="text-small font-medium" style={{ color }}>{label}</span>
        <span className="block text-caption text-medium-gray">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}
