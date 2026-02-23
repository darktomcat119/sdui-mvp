import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
}

const LANGUAGES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
] as const;

interface VariantStyle {
  separator: string;
  btn: string;
  btnHover: string;
  btnActive: string;
}

const VARIANT_CLASSES: Record<'light' | 'dark', VariantStyle> = {
  light: {
    separator: 'text-medium-gray',
    btn: 'text-medium-gray',
    btnHover: 'hover:text-dark-gray',
    btnActive: 'text-institutional-blue font-semibold',
  },
  dark: {
    separator: 'text-white/25',
    btn: 'text-white/35',
    btnHover: 'hover:text-white/70',
    btnActive: 'text-white/90 font-semibold',
  },
};

export function LanguageSwitcher({ variant = 'light' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const vc = VARIANT_CLASSES[variant];

  return (
    <div className="flex items-center">
      {LANGUAGES.map((lang, i) => (
        <span key={lang.code}>
          {i > 0 && <span className={clsx('mx-[2px] text-11 select-none', vc.separator)}>|</span>}
          <button
            className={clsx(
              'border-none bg-none cursor-pointer font-primary text-11 font-normal tracking-[0.5px] py-[2px] px-1 rounded-xs transition-all duration-150 ease-in-out',
              vc.btn,
              vc.btnHover,
              i18n.language === lang.code && vc.btnActive,
            )}
            onClick={() => i18n.changeLanguage(lang.code)}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  );
}
