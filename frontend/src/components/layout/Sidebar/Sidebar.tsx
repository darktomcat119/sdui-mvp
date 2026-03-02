import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types/auth.types';
import { Icon } from '../../ui/Icon/Icon';

interface NavItem {
  labelKey: string;
  icon: string;
  path: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'nav.dashboard',
    icon: 'dashboard',
    path: '/dashboard',
    roles: [
      UserRole.SYSTEM_ADMIN,
      UserRole.MUNICIPAL_ADMIN,
      UserRole.TREASURY_OPERATOR,
      UserRole.LEGAL_ANALYST,
      UserRole.COMPTROLLER_AUDITOR,
      UserRole.VALIDADOR_TECNICO,
    ],
  },
  {
    labelKey: 'nav.taxpayers',
    icon: 'users',
    path: '/taxpayers',
    roles: [UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR],
  },
  {
    labelKey: 'nav.configuration',
    icon: 'settings',
    path: '/configuration',
    roles: [UserRole.MUNICIPAL_ADMIN],
  },
  {
    labelKey: 'nav.determinations',
    icon: 'play',
    path: '/determinations',
    roles: [UserRole.MUNICIPAL_ADMIN, UserRole.TREASURY_OPERATOR, UserRole.VALIDADOR_TECNICO],
  },
  {
    labelKey: 'nav.exceptions',
    icon: 'filter',
    path: '/exceptions',
    roles: [UserRole.MUNICIPAL_ADMIN, UserRole.VALIDADOR_TECNICO],
  },
  {
    labelKey: 'nav.reports',
    icon: 'download',
    path: '/reports',
    roles: [
      UserRole.MUNICIPAL_ADMIN,
      UserRole.TREASURY_OPERATOR,
      UserRole.LEGAL_ANALYST,
      UserRole.COMPTROLLER_AUDITOR,
      UserRole.VALIDADOR_TECNICO,
    ],
  },
  {
    labelKey: 'nav.centralConfig',
    icon: 'settings',
    path: '/central-config',
    roles: [UserRole.SYSTEM_ADMIN],
  },
  {
    labelKey: 'nav.users',
    icon: 'edit',
    path: '/users',
    roles: [UserRole.SYSTEM_ADMIN, UserRole.MUNICIPAL_ADMIN],
  },
  {
    labelKey: 'nav.audit',
    icon: 'audit',
    path: '/audit-log',
    roles: [
      UserRole.SYSTEM_ADMIN,
      UserRole.MUNICIPAL_ADMIN,
      UserRole.COMPTROLLER_AUDITOR,
      UserRole.VALIDADOR_TECNICO,
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const filteredItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role),
  );

  return (
    <aside
      className={clsx(
        'fixed left-0 top-[48px] z-10 h-[calc(100vh-48px)]',
        'bg-white border-r border-border flex flex-col overflow-hidden',
        'transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      <div className={clsx(
        'flex shrink-0 pt-xs px-xs',
        collapsed ? 'justify-center' : 'justify-end',
      )}>
        <button
          className="flex items-center justify-center w-7 h-7 border border-border-light rounded-sm bg-none text-medium-gray cursor-pointer transition-all duration-150 ease-in-out hover:bg-surface-hover hover:text-dark-gray hover:border-border"
          onClick={onToggle}
          title={collapsed ? t('nav.expandMenu') : t('nav.collapseMenu')}
        >
          <Icon name="menu" size={16} />
        </button>
      </div>
      <nav className="flex-1 py-xs pb-md overflow-y-auto overflow-x-hidden">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => clsx(
              'flex items-center gap-sm text-small font-normal no-underline transition-all duration-150 ease-in-out whitespace-nowrap',
              collapsed
                ? 'justify-center py-[9px] border-l-0'
                : 'py-[9px] px-lg border-l-[3px] border-l-transparent',
              isActive
                ? clsx(
                    'bg-action-blue-light text-action-blue font-semibold',
                    !collapsed && 'border-l-action-blue',
                    'hover:bg-action-blue-light hover:text-action-blue hover:no-underline',
                  )
                : 'text-dark-gray hover:bg-surface-hover hover:text-black hover:no-underline',
            )}
            title={collapsed ? t(item.labelKey) : undefined}
          >
            <Icon name={item.icon} size={18} className="w-[18px] h-[18px] shrink-0" />
            <span className={clsx(
              'transition-opacity duration-200 ease-in-out',
              collapsed && 'opacity-0 w-0 overflow-hidden',
            )}>
              {t(item.labelKey)}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
