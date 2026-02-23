export type Environment = 'production' | 'testing' | 'development';

export const getEnvironment = (): Environment => {
  const env = import.meta.env.VITE_ENVIRONMENT || 'development';
  if (['production', 'testing', 'development'].includes(env)) {
    return env as Environment;
  }
  return 'development';
};

export const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
};

export const getBaseUrl = (): string => {
  const apiUrl = getApiUrl();
  return apiUrl.replace(/\/api\/v\d+$/, '');
};

export const getAvatarUrl = (filename: string | null | undefined): string | null => {
  if (!filename) return null;
  return `${getBaseUrl()}/uploads/avatars/${filename}`;
};

export const getAppVersion = (): string => {
  return import.meta.env.VITE_APP_VERSION || '1.0.0';
};
