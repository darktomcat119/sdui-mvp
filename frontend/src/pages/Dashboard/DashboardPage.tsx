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
    <div className="flex flex-col gap-[20px]">
      {/* KPI Cards */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-lg">
        <KpiCard
          label={t('dashboard.totalTaxpayers')}
          value={loading ? '...' : (summary?.totalContribuyentes?.toString() || '0')}
          icon="users"
          color="#0066CC"
        />
        <KpiCard
          label={t('dashboard.determinations')}
          value={loading ? '...' : (summary?.totalDeterminaciones?.toString() || '0')}
          icon="audit"
          color="#2C7A3E"
        />
        <KpiCard
          label={t('dashboard.avgImpact')}
          value={loading ? '...' : (summary ? `${(summary.promedioImpacto * 100).toFixed(1)}%` : '—')}
          icon="filter"
          color="#C47F17"
        />
        <KpiCard
          label={t('dashboard.maxImpact')}
          value={loading ? '...' : (summary ? `${(summary.impactoMaximo * 100).toFixed(1)}%` : '—')}
          icon="dashboard"
          color="#CC3333"
        />
      </div>

      {/* Classification Distribution */}
      {hasDeterminations && (
        <div className="bg-white border border-border rounded-md p-[18px]">
          <h3 className="text-body font-semibold text-black m-0 mb-lg">
            {t('dashboard.classificationBreakdown')}
          </h3>
          <div className="grid grid-cols-3 gap-lg">
            <ClassCard
              label={t('determination.protected')}
              count={summary!.byClasificacion.protegido}
              total={summary!.totalDeterminaciones}
              color="bg-green-500"
              textColor="text-green-700"
            />
            <ClassCard
              label={t('determination.moderate')}
              count={summary!.byClasificacion.moderado}
              total={summary!.totalDeterminaciones}
              color="bg-amber-500"
              textColor="text-amber-600"
            />
            <ClassCard
              label={t('determination.proportional')}
              count={summary!.byClasificacion.proporcional}
              total={summary!.totalDeterminaciones}
              color="bg-red-500"
              textColor="text-red-600"
            />
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {isMunicipal && (
        <div className="bg-white border border-border rounded-md p-[18px]">
          <h3 className="text-body font-semibold text-black m-0 mb-md">
            {t('dashboard.quickActions')}
          </h3>
          <div className="flex gap-sm">
            <Button variant="primary" onClick={() => navigate('/determinations')}>
              <Icon name="play" size={18} />
              {t('dashboard.executeDetermination')}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/taxpayers')}>
              <Icon name="users" size={18} />
              {t('dashboard.viewTaxpayers')}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/reports')}>
              <Icon name="download" size={18} />
              {t('dashboard.viewReports')}
            </Button>
            <Button variant="secondary" onClick={() => navigate('/configuration')}>
              <Icon name="settings" size={18} />
              {t('dashboard.configure')}
            </Button>
          </div>
        </div>
      )}

      {/* Info Card for non-municipal users */}
      {!isMunicipal && (
        <div className="bg-white border border-border rounded-md p-[18px] flex gap-md items-start">
          <div className="w-8 h-8 rounded-sm bg-info-bg flex items-center justify-center shrink-0">
            <Icon name="info" size={16} color="var(--color-action-blue)" />
          </div>
          <div>
            <div className="text-body font-semibold text-black mb-xs">{t('dashboard.sduiSystem')}</div>
            <p className="text-small text-dark-gray leading-[1.5] m-0">
              {t('dashboard.sduiDesc')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-white border border-border rounded-md p-[18px]">
      <div className="flex items-center gap-sm mb-sm">
        <Icon name={icon} size={16} color={color} />
        <span className="text-caption text-medium-gray">{label}</span>
      </div>
      <div className="text-[24px] font-semibold leading-none" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function ClassCard({
  label,
  count,
  total,
  color,
  textColor,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  textColor: string;
}) {
  const pct = total > 0 ? (count / total * 100) : 0;
  return (
    <div className="text-center">
      <p className={`text-heading font-bold ${textColor} mb-xs`}>{count}</p>
      <p className="text-small text-medium-gray mb-sm">{label}</p>
      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-caption text-light-gray">{pct.toFixed(0)}%</span>
    </div>
  );
}
