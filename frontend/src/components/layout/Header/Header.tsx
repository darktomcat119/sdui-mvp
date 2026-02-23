import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { getAppVersion, getAvatarUrl } from '../../../config/environment';
import { Logo } from '../../ui/Logo/Logo';
import { Icon } from '../../ui/Icon/Icon';
import { Avatar } from '../../ui/Avatar/Avatar';
import { LanguageSwitcher } from '../../ui/LanguageSwitcher/LanguageSwitcher';

export function Header() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : '';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-[48px] bg-institutional-blue flex items-center justify-between px-lg fixed top-0 left-0 right-0 z-20">
      <div className="flex items-center gap-md">
        <Logo variant="compact" color="white" width={100} />
        <span className="text-11 text-white/40">v{getAppVersion()}</span>
      </div>
      <div className="flex items-center gap-lg">
        <LanguageSwitcher variant="dark" />
        {user?.municipalityName && (
          <span className="text-small text-white/50">{user.municipalityName}</span>
        )}
        <button
          className="flex items-center gap-sm border-none bg-none py-1 px-sm rounded-sm cursor-pointer transition-colors duration-150 ease-in-out hover:bg-white/10"
          onClick={() => navigate('/profile')}
          title={t('header.myProfile')}
        >
          <Avatar
            src={getAvatarUrl(user?.avatarFilename)}
            initials={initials}
            size="sm"
            className="border-2 border-white/30"
          />
          <div className="hidden lg:block">
            <div className="text-small font-medium text-white/90 whitespace-nowrap">{user?.firstName} {user?.lastName}</div>
            <div className="text-11 text-white/40">{user ? t(`role.${user.role}`) : ''}</div>
          </div>
        </button>
        <button
          className="w-8 h-8 rounded-sm border-none bg-none text-white/50 cursor-pointer flex items-center justify-center shrink-0 transition-all duration-150 ease-in-out hover:bg-white/10 hover:text-white"
          onClick={handleLogout}
          title={t('header.logout')}
        >
          <Icon name="logout" size={18} />
        </button>
      </div>
    </header>
  );
}
