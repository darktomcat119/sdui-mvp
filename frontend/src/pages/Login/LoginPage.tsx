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
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.message;

      if (status === 401) {
        addToast({
          variant: 'error',
          title: t('login.error.invalidCredentials'),
          message: serverMessage || t('login.error.invalidCredentialsMsg'),
        });
      } else if (status === 423 || serverMessage?.includes('bloqueada')) {
        addToast({
          variant: 'warning',
          title: t('login.error.accountLocked'),
          message: serverMessage || t('login.error.accountLockedMsg'),
        });
      } else {
        addToast({
          variant: 'error',
          title: t('login.error.connectionError'),
          message: serverMessage || t('login.error.connectionErrorMsg'),
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
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={fieldErrors.password}
            required
          />

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
