import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { dashboardService } from '../../services/dashboard.service';
import { useAuth } from '../../contexts/AuthContext';
import { Icon } from '../../components/ui/Icon/Icon';
import { Button } from '../../components/ui/Button/Button';
import type { ExecutiveSummary } from '../../types/sdui.types';

export function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await dashboardService.getStats();
        setSummary(response.data);
      } catch {
        // Dashboard may fail for roles without data access
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const isMunicipal = user?.role === 'municipal_admin' || user?.role === 'treasury_operator' || user?.role === 'validador_tecnico';
  const hasDeterminations = summary && summary.totalDeterminaciones > 0;

  return (
    <div className="flex flex-col gap-lg">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-md">
        <KpiCard
          label={t('dashboard.totalTaxpayers')}
          value={loading ? '—' : (summary?.totalContribuyentes?.toString() || '0')}
          icon="users"
          accent="#0066CC"
        />
        <KpiCard
          label={t('dashboard.determinations')}
          value={loading ? '—' : (summary?.totalDeterminaciones?.toString() || '0')}
          icon="audit"
          accent="#2C7A3E"
        />
        <KpiCard
          label={t('dashboard.avgImpact')}
          value={loading ? '—' : (summary ? `${(summary.promedioImpacto * 100).toFixed(1)}%` : '—')}
          icon="filter"
          accent="#C47F17"
        />
        <KpiCard
          label={t('dashboard.maxImpact')}
          value={loading ? '—' : (summary ? `${(summary.impactoMaximo * 100).toFixed(1)}%` : '—')}
          icon="dashboard"
          accent="#A82C2C"
        />
      </div>

      {/* Classification Distribution */}
      {hasDeterminations && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-xl py-md border-b border-border-light">
            <h3 className="text-body font-semibold text-black m-0">
              {t('dashboard.classificationBreakdown')}
            </h3>
          </div>
          <div className="p-xl">
            {/* Stacked bar */}
            <div className="flex rounded-md overflow-hidden h-[28px] mb-lg">
              {summary!.byClasificacion.protegido > 0 && (
                <div
                  className="bg-[#2C7A3E] flex items-center justify-center text-white text-caption font-medium"
                  style={{ width: `${(summary!.byClasificacion.protegido / summary!.totalDeterminaciones) * 100}%` }}
                >
                  {summary!.byClasificacion.protegido}
                </div>
              )}
              {summary!.byClasificacion.moderado > 0 && (
                <div
                  className="bg-[#C47F17] flex items-center justify-center text-white text-caption font-medium"
                  style={{ width: `${(summary!.byClasificacion.moderado / summary!.totalDeterminaciones) * 100}%` }}
                >
                  {summary!.byClasificacion.moderado}
                </div>
              )}
              {summary!.byClasificacion.proporcional > 0 && (
                <div
                  className="bg-[#A82C2C] flex items-center justify-center text-white text-caption font-medium"
                  style={{ width: `${(summary!.byClasificacion.proporcional / summary!.totalDeterminaciones) * 100}%` }}
                >
                  {summary!.byClasificacion.proporcional}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-lg">
              <ClassItem
                label={t('determination.protected')}
                count={summary!.byClasificacion.protegido}
                total={summary!.totalDeterminaciones}
                color="#2C7A3E"
                bgColor="#EBF5ED"
              />
              <ClassItem
                label={t('determination.moderate')}
                count={summary!.byClasificacion.moderado}
                total={summary!.totalDeterminaciones}
                color="#C47F17"
                bgColor="#FDF5E6"
              />
              <ClassItem
                label={t('determination.proportional')}
                count={summary!.byClasificacion.proporcional}
                total={summary!.totalDeterminaciones}
                color="#A82C2C"
                bgColor="#F9EBEB"
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {isMunicipal && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="px-xl py-md border-b border-border-light">
            <h3 className="text-body font-semibold text-black m-0">
              {t('dashboard.quickActions')}
            </h3>
          </div>
          <div className="p-xl">
            <div className="grid grid-cols-4 gap-md">
              <ActionCard
                icon="play"
                label={t('dashboard.executeDetermination')}
                onClick={() => navigate('/determinations')}
                accent="#0066CC"
              />
              <ActionCard
                icon="users"
                label={t('dashboard.viewTaxpayers')}
                onClick={() => navigate('/taxpayers')}
                accent="#2C3E50"
              />
              <ActionCard
                icon="download"
                label={t('dashboard.viewReports')}
                onClick={() => navigate('/reports')}
                accent="#2C7A3E"
              />
              <ActionCard
                icon="settings"
                label={t('dashboard.configure')}
                onClick={() => navigate('/configuration')}
                accent="#C47F17"
              />
            </div>
          </div>
        </div>
      )}

      {/* Info Card for non-municipal users */}
      {!isMunicipal && (
        <div className="bg-white border border-border rounded-lg p-xl flex gap-md items-start">
          <div className="w-8 h-8 rounded-md bg-[#E6F0FF] flex items-center justify-center shrink-0">
            <Icon name="info" size={16} color="var(--color-action-blue)" />
          </div>
          <div>
            <div className="text-body font-semibold text-black mb-xs">{t('dashboard.sduiSystem')}</div>
            <p className="text-small text-dark-gray leading-relaxed m-0">
              {t('dashboard.sduiDesc')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── KPI Card ─── */
function KpiCard({
  label, value, icon, accent,
}: {
  label: string; value: string; icon: string; accent: string;
}) {
  return (
    <div
      className="bg-white border border-border rounded-lg p-lg border-l-[3px]"
      style={{ borderLeftColor: accent }}
    >
      <div className="flex items-center gap-sm mb-md">
        <Icon name={icon} size={14} color={accent} />
        <span className="text-caption text-medium-gray uppercase tracking-[0.3px]">{label}</span>
      </div>
      <div className="text-[28px] font-semibold text-black leading-none font-mono">
        {value}
      </div>
    </div>
  );
}

/* ─── Classification Item ─── */
function ClassItem({
  label, count, total, color, bgColor,
}: {
  label: string; count: number; total: number; color: string; bgColor: string;
}) {
  const pct = total > 0 ? (count / total * 100) : 0;
  return (
    <div className="flex items-center gap-md p-md rounded-md" style={{ backgroundColor: bgColor }}>
      <div className="text-[22px] font-bold font-mono leading-none" style={{ color }}>
        {count}
      </div>
      <div>
        <span className="text-small font-medium" style={{ color }}>{label}</span>
        <span className="block text-caption text-medium-gray">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

/* ─── Action Card ─── */
function ActionCard({
  icon, label, onClick, accent,
}: {
  icon: string; label: string; onClick: () => void; accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-sm p-lg bg-surface rounded-lg border border-border-light hover:border-border hover:bg-surface-hover transition-colors duration-150 cursor-pointer"
    >
      <div
        className="w-10 h-10 rounded-md flex items-center justify-center"
        style={{ backgroundColor: `${accent}10`, color: accent }}
      >
        <Icon name={icon} size={20} />
      </div>
      <span className="text-small font-medium text-dark-gray text-center">{label}</span>
    </button>
  );
}
