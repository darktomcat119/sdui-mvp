import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { DocumentsService } from './documents.service';
import { GenerateDictamenDto, DocumentQueryDto } from './dto/documents.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/constants/roles.constant';
import { RequestUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('documents')
@UseGuards(RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('dictamen')
  @Roles(UserRole.MUNICIPAL_ADMIN, UserRole.LEGAL_ANALYST)
  async generateDictamen(
    @Body() dto: GenerateDictamenDto,
    @CurrentUser() user: RequestUser,
    @Req() req: Request,
  ) {
    const doc = await this.documentsService.generateDictamen(
      dto.determinationId,
      user,
      req.ip,
    );
    return {
      data: {
        id: doc.id,
        hashSha256: doc.hashSha256,
        nombreArchivo: doc.nombreArchivo,
        tamanoBytes: doc.tamanoBytes,
      },
      message: 'Dictamen generated successfully',
    };
  }

  @Get()
  @Roles(
    UserRole.MUNICIPAL_ADMIN,
    UserRole.TREASURY_OPERATOR,
    UserRole.LEGAL_ANALYST,
    UserRole.COMPTROLLER_AUDITOR,
    UserRole.VALIDADOR_TECNICO,
  )
  async findByDetermination(
    @Query() query: DocumentQueryDto,
    @CurrentUser() user: RequestUser,
  ) {
    if (!query.determinationId) {
      return { data: [] };
    }
    const data = await this.documentsService.findByDetermination(
      query.determinationId,
      user,
    );
    return { data };
  }

  @Get('verify/:hash')
  @Public()
  async verify(@Param('hash') hash: string) {
    const result = await this.documentsService.verifyByHash(hash);
    return { data: result };
  }

  @Get(':id/download')
  @Roles(
    UserRole.MUNICIPAL_ADMIN,
    UserRole.TREASURY_OPERATOR,
    UserRole.LEGAL_ANALYST,
    UserRole.COMPTROLLER_AUDITOR,
    UserRole.VALIDADOR_TECNICO,
  )
  async download(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.documentsService.getFileBuffer(
      id,
      user,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(buffer);
  }
}
