import type { ChangeEvent, FC } from 'react';
import clsx from 'clsx';

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  error?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export const Input: FC<InputProps> = ({
  label,
  placeholder,
  type = 'text',
  error,
  value,
  onChange,
  required = false,
  id,
  disabled = false,
  className,
}) => {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-[6px]">
      {label && (
        <label htmlFor={inputId} className="font-primary text-small font-medium text-dark-gray leading-none">
          {label}
          {required && <span className="text-error ml-[2px]">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={clsx(
          'font-primary text-body font-normal text-black bg-white border border-border rounded-sm min-h-[44px] px-[14px] w-full leading-[1.5]',
          'transition-[border-color] duration-150 ease-in-out',
          'placeholder:text-medium-gray placeholder:not-italic',
          'hover:not-focus:not-disabled:border-medium-gray',
          'focus:outline-none focus:border-action-blue focus:border-2 focus:px-[13px]',
          'disabled:bg-surface disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-error focus:border-error',
          className,
        )}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error && inputId ? `${inputId}-error` : undefined}
      />
      {error && (
        <p
          id={inputId ? `${inputId}-error` : undefined}
          className="font-primary text-caption font-normal text-error leading-[1.4] m-0"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};
