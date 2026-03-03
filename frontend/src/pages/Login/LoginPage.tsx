import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getAppVersion } from '../../config/environment';
import { Logo } from '../../components/ui/Logo/Logo';
import { LogoParticles } from '../../components/ui/LogoParticles/LogoParticles';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { LanguageSwitcher } from '../../components/ui/LanguageSwitcher/LanguageSwitcher';

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem('sessionExpired')) {
      sessionStorage.removeItem('sessionExpired');
      addToast({ variant: 'info', title: t('session.expired'), message: t('session.expiredMessage') });
    }
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = t('login.error.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('login.error.emailInvalid');
    }
    if (!password) {
      errors.password = t('login.error.passwordRequired');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      const data = err.response?.data;
      const code: string = data?.message || '';
      const attemptsRemaining: number | undefined = data?.attemptsRemaining;
      const minutesLeft: number | undefined = data?.minutesLeft;

      if (code === 'INVALID_CREDENTIALS') {
        setLoginError({
          title: t('login.error.invalidCredentials'),
          message: attemptsRemaining !== undefined
            ? t('login.error.invalidCredentialsMsgAttempts', { count: attemptsRemaining })
            : t('login.error.invalidCredentialsMsg'),
        });
      } else if (code === 'ACCOUNT_LOCKED') {
        setLoginError({
          title: t('login.error.accountLocked'),
          message: minutesLeft !== undefined
            ? t('login.error.accountLockedMsgMinutes', { count: minutesLeft })
            : t('login.error.accountLockedMsg'),
        });
      } else if (code === 'ACCOUNT_INACTIVE') {
        setLoginError({
          title: t('login.error.accountInactive'),
          message: t('login.error.accountInactiveMsg'),
        });
      } else if (code === 'MUNICIPALITY_INACTIVE') {
        setLoginError({
          title: t('login.error.accessDenied'),
          message: t('login.error.municipalityInactiveMsg'),
        });
      } else {
        setLoginError({
          title: t('login.error.connectionError'),
          message: t('login.error.connectionErrorMsg'),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-institutional-blue p-xl relative overflow-hidden">
      <LogoParticles />
      <div className="relative z-[1] w-full max-w-[420px] bg-white rounded-xl border border-border-light p-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
        <div className="flex justify-end mb-sm">
          <LanguageSwitcher variant="light" />
        </div>
        <div className="text-center mb-xl">
          <Logo variant="full" color="institutional" width={180} />
        </div>

        <form className="flex flex-col gap-lg" onSubmit={handleSubmit} noValidate>
          <Input
            id="email"
            label={t('login.emailLabel')}
            placeholder={t('login.emailPlaceholder')}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (loginError) setLoginError(null);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={fieldErrors.email}
            required
          />

          <Input
            id="password"
            label={t('login.passwordLabel')}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (loginError) setLoginError(null);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={fieldErrors.password}
            required
          />

          {loginError && (
            <div className="flex gap-sm p-md rounded-md bg-[#FEF2F2] border border-[#FECACA]">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={18} height={18} fill="#DC2626" className="shrink-0 mt-[1px]" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <div className="flex flex-col gap-[2px]">
                <span className="text-small font-semibold text-[#991B1B]">{loginError.title}</span>
                <span className="text-caption text-[#B91C1C] leading-[1.4]">{loginError.message}</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            {t('login.submit')}
          </Button>
        </form>

        <p className="text-center mt-lg text-caption text-medium-gray">
          {t('login.recovery')}
        </p>

        <div className="text-center mt-xl pt-lg border-t border-border-light font-mono text-[10px] text-medium-gray leading-[1.6]">
          SDUI v{getAppVersion()}
          <br />
          {t('login.copyright')}
        </div>
      </div>
    </div>
  );
}
