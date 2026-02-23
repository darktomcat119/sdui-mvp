import clsx from 'clsx';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  initials: string;
  size?: AvatarSize;
  className?: string;
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-11',
  md: 'w-9 h-9 text-small',
  lg: 'w-16 h-16 text-h2',
  xl: 'w-24 h-24 text-[32px]',
};

export function Avatar({ src, initials, size = 'md', className }: AvatarProps) {
  const base = clsx(
    'rounded-full overflow-hidden inline-flex items-center justify-center shrink-0',
    SIZE_CLASSES[size],
    className,
  );

  if (src) {
    return (
      <div className={base}>
        <img src={src} alt={initials} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={clsx(base, 'bg-institutional-blue text-white font-primary font-semibold uppercase')}>
      <span>{initials}</span>
    </div>
  );
}
