import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTranslation } from 'react-i18next';
import { profileService } from '../../services/profile.service';
import type { UpdateProfileData } from '../../services/profile.service';
import { getAvatarUrl } from '../../config/environment';
import { AvatarUpload } from '../../components/ui/AvatarUpload/AvatarUpload';
import { Input } from '../../components/ui/Input/Input';
import { Button } from '../../components/ui/Button/Button';
import { Icon } from '../../components/ui/Icon/Icon';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const { t, i18n } = useTranslation();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarFilename, setAvatarFilename] = useState(user?.avatarFilename || null);

  // Sync form when user updates from context
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setEmail(user.email);
      setAvatarFilename(user.avatarFilename || null);
    }
  }, [user]);

  if (!user) return null;

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;

  const handleCancel = () => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setAvatarFilename(user.avatarFilename || null);
    setEditing(false);
  };

  const handleAvatarUploaded = async (filename: string) => {
    setAvatarFilename(filename);
    // Persist avatar immediately (no need to be in edit mode)
    try {
      await profileService.updateProfile({ avatarFilename: filename });
      await refreshUser();
      addToast({ variant: 'success', message: t('profile.avatarSuccess') });
    } catch {
      addToast({ variant: 'error', message: t('profile.avatarError') });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const data: UpdateProfileData = {};
    if (firstName !== user.firstName) data.firstName = firstName;
    if (lastName !== user.lastName) data.lastName = lastName;
    if (email !== user.email) data.email = email;

    if (Object.keys(data).length === 0) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await profileService.updateProfile(data);
      await refreshUser();
      setEditing(false);
      addToast({ variant: 'success', message: t('profile.updateSuccess') });
    } catch {
      addToast({ variant: 'error', message: t('profile.updateError') });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString(i18n.language === 'en' ? 'en-US' : 'es-MX', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="flex items-center gap-xl p-xl border-b border-border-light bg-surface">
          <AvatarUpload
            currentSrc={getAvatarUrl(avatarFilename)}
            initials={initials}
            size="xl"
            onUploaded={handleAvatarUploaded}
          />
          <div className="flex flex-col gap-xs">
            <h2 className="text-h2 font-semibold text-black m-0 leading-[1.3]">
              {user.firstName} {user.lastName}
            </h2>
            <span className="self-start text-caption font-medium text-action-blue bg-action-blue-light py-[3px] px-[10px] rounded-full">
              {t(`role.${user.role}`)}
            </span>
          </div>
        </div>

        <form className="p-xl flex flex-col gap-lg" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between">
            <h3 className="text-h3 font-semibold text-black m-0">{t('profile.personalInfo')}</h3>
            {!editing && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                <Icon name="edit" size={14} />
                {t('common.edit')}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg">
            <Input
              id="firstName"
              label={t('profile.firstName')}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={!editing}
              required
            />
            <Input
              id="lastName"
              label={t('profile.lastName')}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={!editing}
              required
            />
          </div>

          <Input
            id="email"
            label={t('profile.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!editing}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-lg pt-lg border-t border-border-light">
            <div className="flex flex-col gap-xs">
              <span className="text-caption font-medium text-medium-gray uppercase tracking-[0.5px]">{t('profile.role')}</span>
              <span className="text-body text-dark-gray">
                {t(`role.${user.role}`)}
              </span>
            </div>
            <div className="flex flex-col gap-xs">
              <span className="text-caption font-medium text-medium-gray uppercase tracking-[0.5px]">{t('profile.municipality')}</span>
              <span className="text-body text-dark-gray">
                {user.municipalityName || t('profile.municipalityDefault')}
              </span>
            </div>
            <div className="flex flex-col gap-xs">
              <span className="text-caption font-medium text-medium-gray uppercase tracking-[0.5px]">{t('profile.status')}</span>
              <span className="text-body text-dark-gray">
                {user.status === 'active' ? t('status.active') : user.status === 'inactive' ? t('status.inactive') : user.status || '—'}
              </span>
            </div>
            <div className="flex flex-col gap-xs">
              <span className="text-caption font-medium text-medium-gray uppercase tracking-[0.5px]">{t('profile.lastAccess')}</span>
              <span className="text-body text-dark-gray">
                {formatDate(user.lastLoginAt)}
              </span>
            </div>
          </div>

          {editing && (
            <div className="flex justify-end gap-md pt-lg border-t border-border-light">
              <Button
                variant="tertiary"
                onClick={handleCancel}
                disabled={saving}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={saving}
              >
                <Icon name="save" size={14} />
                {t('common.save')}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
