import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

type Environment = 'production' | 'testing' | 'development';

interface EnvironmentBannerProps {
  environment: Environment;
}

const ENV_KEYS: Record<Environment, { titleKey: string; subtitleKey?: string }> = {
  production: { titleKey: 'env.production', subtitleKey: 'env.productionSubtitle' },
  testing: { titleKey: 'env.testing' },
  development: { titleKey: 'env.development' },
};

const ENV_CLASSES: Record<Environment, string> = {
  production: 'bg-env-production-bg border-l-warning',
  testing: 'bg-env-testing-bg border-l-info',
  development: 'bg-off-white border-l-dark-gray',
};

export const EnvironmentBanner: FC<EnvironmentBannerProps> = ({ environment }) => {
  const { t } = useTranslation();
  const config = ENV_KEYS[environment];

  return (
    <div
      className={clsx(
        'flex flex-col gap-xs font-primary py-md px-lg rounded-sm border-l-4 border-l-transparent',
        ENV_CLASSES[environment],
      )}
      role="status"
    >
      <p className="text-body font-semibold text-black leading-[1.3] m-0 uppercase">
        {t(config.titleKey)}
      </p>
      {config.subtitleKey && (
        <p className="text-dense-table font-normal text-dark-gray leading-[1.5] m-0">
          {t(config.subtitleKey)}
        </p>
      )}
    </div>
  );
};
