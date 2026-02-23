import type { ReactNode, FC } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  title?: string;
  accentColor?: string;
  className?: string;
}

export const Card: FC<CardProps> = ({
  children,
  title,
  accentColor,
  className,
}) => {
  return (
    <div
      className={clsx(
        'bg-white border border-border rounded-lg p-xl',
        accentColor && 'border-t-2',
        className,
      )}
      style={accentColor ? { borderTopColor: accentColor } : undefined}
    >
      {title && (
        <h3 className="font-primary text-h3 font-semibold text-black leading-[1.3] mb-lg">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};
