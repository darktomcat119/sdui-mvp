import type { ReactNode, MouseEvent, FC } from 'react';
import clsx from 'clsx';
import { Icon } from '../Icon/Icon';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface ButtonProps {
  variant?: ButtonVariant;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-action-blue text-white font-semibold hover:not-disabled:bg-action-blue-hover active:not-disabled:bg-action-blue-active',
  secondary:
    'bg-transparent text-action-blue border-action-blue hover:not-disabled:bg-action-blue-light active:not-disabled:bg-secondary-active',
  tertiary:
    'bg-transparent text-dark-gray border-border hover:not-disabled:bg-surface active:not-disabled:bg-surface-hover',
};

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  children,
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  className,
}) => {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex items-center justify-center gap-sm font-primary text-button font-medium leading-none',
        'rounded-sm py-[10px] px-[20px] cursor-pointer transition-all duration-150 ease-in-out',
        'no-underline border border-transparent whitespace-nowrap',
        'focus-visible:outline-2 focus-visible:outline-action-blue focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        fullWidth && 'w-full',
        className,
      )}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <Icon name="spinner" size={16} className="animate-spin shrink-0" />}
      {children}
    </button>
  );
};
