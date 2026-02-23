import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Icon } from '../Icon/Icon';

type Status = 'success' | 'warning' | 'error' | 'info' | 'pending' | 'active' | 'inactive' | 'locked';

interface StatusBadgeProps {
  status: Status;
}

type ResolvedStatus = 'success' | 'warning' | 'error' | 'info';

const STATUS_MAP: Record<Status, ResolvedStatus> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
  pending: 'warning',
  active: 'success',
  inactive: 'warning',
  locked: 'error',
};

const STATUS_ICON_NAMES: Record<ResolvedStatus, string> = {
  success: 'checkCircle',
  warning: 'alertTriangle',
  error: 'xCircle',
  info: 'info',
};

const VARIANT_CLASSES: Record<ResolvedStatus, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  error: 'bg-error-bg text-error',
  info: 'bg-info-bg text-info',
};

export const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();
  const resolved = STATUS_MAP[status];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-primary text-dense-table font-medium leading-none py-[5px] px-md rounded-full whitespace-nowrap',
        VARIANT_CLASSES[resolved],
      )}
    >
      <Icon name={STATUS_ICON_NAMES[resolved]} size={14} className="inline-flex shrink-0" />
      {t(`status.${status}`)}
    </span>
  );
};
