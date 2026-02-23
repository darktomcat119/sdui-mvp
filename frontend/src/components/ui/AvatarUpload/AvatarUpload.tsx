import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { Avatar } from '../Avatar/Avatar';
import { Icon } from '../Icon/Icon';
import { profileService } from '../../../services/profile.service';

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED = '.jpg,.jpeg,.png,.webp';

interface AvatarUploadProps {
  currentSrc?: string | null;
  initials: string;
  size?: 'lg' | 'xl';
  onUploaded: (filename: string) => void;
}

export function AvatarUpload({
  currentSrc,
  initials,
  size = 'xl',
  onUploaded,
}: AvatarUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (!uploading) inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > MAX_SIZE) {
      setError(t('avatar.fileTooLarge'));
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    setUploading(true);
    try {
      const filename = await profileService.uploadAvatar(file);
      onUploaded(filename);
    } catch {
      setError(t('avatar.uploadError'));
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-xs">
      <button
        type="button"
        className={clsx(
          'group relative border-none bg-none p-0 cursor-pointer rounded-full transition-opacity duration-150 ease-in-out',
          'disabled:cursor-not-allowed disabled:opacity-70',
        )}
        onClick={handleClick}
        disabled={uploading}
      >
        <Avatar
          src={preview || currentSrc}
          initials={initials}
          size={size}
        />
        <div
          className={clsx(
            'absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white',
            'opacity-0 transition-opacity duration-150 ease-in-out',
            'group-hover:opacity-100 group-focus-visible:opacity-100 group-disabled:opacity-100',
          )}
        >
          {uploading ? (
            <Icon name="spinner" size={20} className="animate-spin" />
          ) : (
            <Icon name="camera" size={20} />
          )}
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="sr-only"
        onChange={handleChange}
      />
      {error && <p className="text-caption text-error m-0">{error}</p>}
    </div>
  );
}
