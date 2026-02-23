import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usersService } from '../../services/users.service';
import { UserRole } from '../../types/auth.types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getAvatarUrl } from '../../config/environment';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { Icon } from '../../components/ui/Icon/Icon';
import { AvatarUpload } from '../../components/ui/AvatarUpload/AvatarUpload';

export function CreateUserPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [avatarFilename, setAvatarFilename] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.TREASURY_OPERATOR as string,
  });

  const availableRoles =
    currentUser?.role === UserRole.SYSTEM_ADMIN
      ? Object.values(UserRole)
      : [
          UserRole.TREASURY_OPERATOR,
          UserRole.LEGAL_ANALYST,
          UserRole.COMPTROLLER_AUDITOR,
        ];

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.firstName.trim() || form.firstName.trim().length < 2) {
      errors.firstName = t('createUser.validation.firstNameMin');
    }
    if (!form.lastName.trim() || form.lastName.trim().length < 2) {
      errors.lastName = t('createUser.validation.lastNameMin');
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = t('createUser.validation.emailInvalid');
    }
    if (form.password.length < 8) {
      errors.password = t('createUser.validation.passwordMin');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      errors.password = t('createUser.validation.passwordWeak');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateField = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await usersService.create({
        ...form,
        municipalityId: currentUser?.municipalityId || undefined,
        avatarFilename: avatarFilename || undefined,
      });
      addToast({ variant: 'success', message: t('createUser.success') });
      navigate('/users');
    } catch (err: any) {
      addToast({
        variant: 'error',
        message: err.response?.data?.message || t('createUser.error'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[520px]">
      <Card>
        <form className="flex flex-col gap-lg" onSubmit={handleSubmit}>
          <div className="flex items-center gap-lg pb-lg border-b border-border-light">
            <AvatarUpload
              currentSrc={getAvatarUrl(avatarFilename)}
              initials={
                (form.firstName.charAt(0) || '?') +
                (form.lastName.charAt(0) || '?')
              }
              size="lg"
              onUploaded={setAvatarFilename}
            />
            <span className="text-small text-medium-gray">{t('createUser.avatarHint')}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
            <Input
              id="firstName"
              label={t('createUser.firstName')}
              value={form.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              error={formErrors.firstName}
              required
            />
            <Input
              id="lastName"
              label={t('createUser.lastName')}
              value={form.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              error={formErrors.lastName}
              required
            />
          </div>

          <Input
            id="email"
            label={t('createUser.email')}
            type="email"
            placeholder={t('createUser.emailPlaceholder')}
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            error={formErrors.email}
            required
          />

          <Input
            id="password"
            label={t('createUser.password')}
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            error={formErrors.password}
            required
          />

          <div>
            <label className="block font-medium text-small text-dark-gray mb-[6px]">{t('createUser.role')}</label>
            <select
              className="w-full min-h-[40px] px-[14px] border border-border rounded-sm font-primary text-body bg-white text-black transition-[border-color] duration-150 ease-in-out hover:border-medium-gray focus:outline-none focus:border-action-blue focus:border-2 focus:px-[13px]"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {t(`role.${role}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-sm mt-sm">
            <Button type="submit" variant="primary" loading={loading}>
              <Icon name="plus" size={16} />
              {t('createUser.submit')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/users')}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
