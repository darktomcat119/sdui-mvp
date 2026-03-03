import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WeightsTab } from './tabs/WeightsTab';
import { ZonesTab } from './tabs/ZonesTab';
import { ScianTab } from './tabs/ScianTab';
import { MunicipalityTab } from './tabs/MunicipalityTab';

const TABS = ['weights', 'zones', 'scian', 'general'] as const;
type TabKey = (typeof TABS)[number];

export function ConfigurationPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('weights');

  const tabLabels: Record<TabKey, string> = {
    weights: t('config.tabWeights'),
    zones: t('config.tabZones'),
    scian: t('config.tabScian'),
    general: t('config.tabGeneral'),
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex gap-xs bg-white border border-border rounded-lg p-xs">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-sm px-lg text-small font-medium rounded-md transition-all duration-150 cursor-pointer border-none ${
              activeTab === tab
                ? 'bg-action-blue text-white'
                : 'bg-transparent text-medium-gray hover:bg-surface hover:text-dark-gray'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'weights' && <WeightsTab />}
        {activeTab === 'zones' && <ZonesTab />}
        {activeTab === 'scian' && <ScianTab />}
        {activeTab === 'general' && <MunicipalityTab />}
      </div>
    </div>
  );
}
