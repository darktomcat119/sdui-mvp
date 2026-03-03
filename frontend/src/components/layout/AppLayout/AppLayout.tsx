import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Sidebar } from '../Sidebar/Sidebar';
import { Header } from '../Header/Header';
import { Icon } from '../../ui/Icon/Icon';

interface RouteConfig {
  titleKey: string;
  subtitleKey: string;
  icon: string;
}

const ROUTE_CONFIG: Record<string, RouteConfig> = {
  '/dashboard': { titleKey: 'route.dashboard.title', subtitleKey: 'route.dashboard.subtitle', icon: 'dashboard' },
  '/taxpayers': { titleKey: 'route.taxpayers.title', subtitleKey: 'route.taxpayers.subtitle', icon: 'users' },
  '/taxpayers/new': { titleKey: 'route.taxpayersNew.title', subtitleKey: 'route.taxpayersNew.subtitle', icon: 'users' },
  '/configuration': { titleKey: 'route.configuration.title', subtitleKey: 'route.configuration.subtitle', icon: 'settings' },
  '/determinations': { titleKey: 'route.determinations.title', subtitleKey: 'route.determinations.subtitle', icon: 'play' },
  '/exceptions': { titleKey: 'route.exceptions.title', subtitleKey: 'route.exceptions.subtitle', icon: 'filter' },
  '/reports': { titleKey: 'route.reports.title', subtitleKey: 'route.reports.subtitle', icon: 'download' },
  '/central-config': { titleKey: 'route.centralConfig.title', subtitleKey: 'route.centralConfig.subtitle', icon: 'settings' },
  '/users': { titleKey: 'route.users.title', subtitleKey: 'route.users.subtitle', icon: 'users' },
  '/users/new': { titleKey: 'route.usersNew.title', subtitleKey: 'route.usersNew.subtitle', icon: 'users' },
  '/audit-log': { titleKey: 'route.auditLog.title', subtitleKey: 'route.auditLog.subtitle', icon: 'audit' },
  '/profile': { titleKey: 'route.profile.title', subtitleKey: 'route.profile.subtitle', icon: 'user' },
};

// Match dynamic routes like /determinations/:id
function getRouteConfig(pathname: string): RouteConfig | undefined {
  if (ROUTE_CONFIG[pathname]) return ROUTE_CONFIG[pathname];
  if (/^\/determinations\/[^/]+$/.test(pathname)) {
    return { titleKey: 'route.determinationDetail.title', subtitleKey: 'route.determinationDetail.subtitle', icon: 'play' };
  }
  return undefined;
}

export function AppLayout() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 768);
  const config = getRouteConfig(pathname);

  return (
    <div className="min-h-screen">
      <Header />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className={clsx(
        'mt-[48px] bg-surface min-h-[calc(100vh-48px)] transition-[margin-left] duration-200 ease-in-out',
        collapsed ? 'ml-[60px]' : 'ml-[220px]',
      )}>
        {config && (
          <div className="flex items-center gap-lg py-lg px-2xl bg-white border-b border-border">
            <div className="w-10 h-10 rounded-md bg-institutional-blue-light text-institutional-blue flex items-center justify-center shrink-0">
              <Icon name={config.icon} size={20} />
            </div>
            <div>
              <h1 className="text-h3 font-semibold text-black leading-[1.3] m-0">{t(config.titleKey)}</h1>
              <p className="text-small text-medium-gray mt-[2px] mb-0">{t(config.subtitleKey)}</p>
            </div>
          </div>
        )}
        <div className="py-xl px-2xl pb-2xl max-w-[1280px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
