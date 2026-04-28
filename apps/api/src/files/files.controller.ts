import {
  Controller, Post, Get, Delete, Param, Query, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('projects/:projectId/files')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } }))
  async uploadFile(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('nodeId') nodeId: string | undefined,
    @CurrentUser() user: { sub: string; organizationId: string },
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni');
    const result = await this.filesService.upload(projectId, user.sub, user.organizationId, file, nodeId);
    return { success: true, data: result };
  }

  @Get('projects/:projectId/files')
  async listFiles(
    @Param('projectId') projectId: string,
    @Query('nodeId') nodeId: string | undefined,
    @Query('fileType') fileType: string | undefined,
    @Query('search') search: string | undefined,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const result = await this.filesService.listFiles(projectId, {
      nodeId, fileType, search,
      page: parseInt(page), limit: parseInt(limit),
    });
    return { success: true, ...result };
  }

  @Get('files/:id/url')
  async getSignedUrl(
    @Param('id') id: string,
    @Query('purpose') purpose: 'view' | 'download' = 'view',
  ) {
    const result = await this.filesService.getSignedUrl(id, purpose);
    return { success: true, data: result };
  }

  @Delete('files/:id')
  async deleteFile(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; organizationId: string },
  ) {
    const result = await this.filesService.deleteFile(id, user.organizationId);
    return { success: true, data: result };
  }
}
