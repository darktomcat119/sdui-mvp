import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { avatarMulterOptions } from '../../config/upload.config';

@Controller('uploads')
export class UploadsController {
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', avatarMulterOptions))
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo.');
    }
    return { filename: file.filename };
  }
}
