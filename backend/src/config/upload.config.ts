import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { BadRequestException } from '@nestjs/common';

export const UPLOAD_AVATAR_DIR = join(process.cwd(), 'uploads', 'avatars');
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const avatarMulterOptions = {
  storage: diskStorage({
    destination: UPLOAD_AVATAR_DIR,
    filename: (_req: any, file: Express.Multer.File, cb: any) => {
      const userId = _req.user?.id || 'unknown';
      const ext = extname(file.originalname).toLowerCase();
      const filename = `${userId}-${Date.now()}${ext}`;
      cb(null, filename);
    },
  }),
  limits: { fileSize: MAX_AVATAR_SIZE },
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    cb: any,
  ) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new BadRequestException(
          'Solo se permiten imágenes JPG, PNG o WebP.',
        ),
        false,
      );
    }
    cb(null, true);
  },
};
