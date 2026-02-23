import { useTranslation } from 'react-i18next';
import { Icon } from '../../components/ui/Icon/Icon';

const METRICS = [
  { labelKey: 'dashboard.activeLicenses', value: '—', icon: 'audit', color: '#0066CC' },
  { labelKey: 'dashboard.pendingReview', value: '—', icon: 'filter', color: '#C47F17' },
  { labelKey: 'dashboard.monthlyRevenue', value: '—', icon: 'checkCircle', color: '#2C7A3E' },
  { labelKey: 'dashboard.actionsToday', value: '—', icon: 'dashboard', color: '#4A4A4A' },
];

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-[20px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-lg">
        {METRICS.map((metric) => (
          <div key={metric.labelKey} className="bg-white border border-border rounded-md p-[18px]">
            <div className="text-caption text-medium-gray mb-sm">{t(metric.labelKey)}</div>
            <div className="text-[24px] font-semibold leading-none" style={{ color: metric.color }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-border rounded-md p-[18px] flex gap-md items-start">
        <div className="w-8 h-8 rounded-sm bg-info-bg flex items-center justify-center shrink-0">
          <Icon name="info" size={16} color="var(--color-action-blue)" />
        </div>
        <div>
          <div className="text-body font-semibold text-black mb-xs">{t('dashboard.licensesModule')}</div>
          <p className="text-small text-dark-gray leading-[1.5] m-0">
            {t('dashboard.licensesModuleDesc')}
          </p>
        </div>
      </div>
    </div>
  );
}
