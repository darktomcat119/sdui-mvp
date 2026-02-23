import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import type { Toast as ToastType, ToastVariant } from '../../../contexts/ToastContext';
import { useToast } from '../../../contexts/ToastContext';
import { Icon } from '../Icon/Icon';

const VARIANT_ICONS: Record<ToastVariant, string> = {
  success: 'checkCircle',
  error: 'xCircle',
  warning: 'alertTriangle',
  info: 'info',
};

interface VariantClasses {
  toast: string;
  iconWrap: string;
  progress: string;
}

const VARIANT_CLASSES: Record<ToastVariant, VariantClasses> = {
  success: {
    toast: 'bg-success-bg border-toast-success-border',
    iconWrap: 'bg-success text-white',
    progress: 'bg-success',
  },
  error: {
    toast: 'bg-error-bg border-toast-error-border',
    iconWrap: 'bg-error text-white',
    progress: 'bg-error',
  },
  warning: {
    toast: 'bg-warning-bg border-toast-warning-border',
    iconWrap: 'bg-warning text-white',
    progress: 'bg-warning',
  },
  info: {
    toast: 'bg-info-bg border-toast-info-border',
    iconWrap: 'bg-info text-white',
    progress: 'bg-info',
  },
};

function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: (id: number) => void }) {
  const { t } = useTranslation();
  const [exiting, setExiting] = useState(false);
  const vc = VARIANT_CLASSES[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 150);
    }, 4850);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 150);
  };

  return (
    <div
      className={clsx(
        'flex items-start gap-md p-lg rounded-md border shadow-[0_4px_16px_rgba(30,58,95,0.08)]',
        'relative overflow-hidden',
        exiting ? 'animate-slide-out' : 'animate-slide-in',
        vc.toast,
      )}
      role="alert"
    >
      <div className={clsx('flex items-center justify-center w-7 h-7 rounded-sm shrink-0', vc.iconWrap)}>
        <Icon name={VARIANT_ICONS[toast.variant]} size={14} />
      </div>
      <div className="flex-1 min-w-0 pt-[3px]">
        {toast.title && (
          <div className="text-small font-semibold text-black leading-[1.3]">{toast.title}</div>
        )}
        <div className={clsx('text-caption text-dark-gray leading-[1.5]', toast.title && 'mt-[2px]')}>
          {toast.message}
        </div>
      </div>
      <button
        className="shrink-0 flex items-center justify-center w-6 h-6 border-none bg-none text-medium-gray cursor-pointer p-0 rounded-xs transition-all duration-150 ease-in-out hover:text-dark-gray hover:bg-black/5 -mt-[2px] -mr-1"
        onClick={handleClose}
        aria-label={t('common.close')}
      >
        <Icon name="close" size={12} />
      </button>
      <div className={clsx('absolute bottom-0 left-0 h-[2px] animate-shrink', vc.progress)} />
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-xl right-xl z-[1000] flex flex-col-reverse gap-sm w-[calc(100vw-32px)] sm:w-[380px]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
