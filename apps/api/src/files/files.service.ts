import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { FileType, FileStatus } from '@prisma/client';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZES, ErrorCode } from '@bilnov/shared';

@Injectable()
export class FilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async upload(
    projectId: string,
    uploaderId: string,
    organizationId: string,
    file: Express.Multer.File,
    nodeId?: string,
  ) {
    // Déterminer le type
    const fileType = this.detectFileType(file.mimetype, file.originalname);

    // Vérifier la taille
    const maxSize = fileType === 'IMAGE_360'
      ? MAX_FILE_SIZES.IMAGE_360
      : file.mimetype.startsWith('video/')
        ? MAX_FILE_SIZES.VIDEO
        : MAX_FILE_SIZES.DEFAULT;

    if (file.size > maxSize) {
      throw new BadRequestException({
        code: ErrorCode.FILE_TOO_LARGE,
        message: `Fichier trop volumineux. Maximum : ${Math.round(maxSize / 1024 / 1024)} Mo`,
      });
    }

    // Upload vers S3/R2
    const { storageKey, sizeBytes } = await this.storage.upload(
      file.buffer,
      file.originalname,
      file.mimetype,
      organizationId,
      projectId,
    );

    // Créer l'enregistrement en BDD
    const fileRecord = await this.prisma.file.create({
      data: {
        projectId,
        nodeId,
        uploaderId,
        name: file.originalname,
        fileType: fileType as FileType,
        mimeType: file.mimetype,
        storageKey,
        sizeBytes,
        status: FileStatus.ACTIVE,
      },
    });

    // Mettre à jour le stockage utilisé
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { storageUsedBytes: { increment: sizeBytes } },
    });

    return fileRecord;
  }

  async getSignedUrl(fileId: string, purpose: 'view' | 'download') {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.status === FileStatus.DELETED) {
      throw new NotFoundException({ code: ErrorCode.NOT_FOUND, message: 'Fichier introuvable' });
    }

    return this.storage.generateSignedUrl(
      file.storageKey,
      purpose,
      purpose === 'download' ? file.name : undefined,
    );
  }

  async listFiles(projectId: string, filters: {
    nodeId?: string;
    fileType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { nodeId, fileType, search, page = 1, limit = 20 } = filters;

    const where = {
      projectId,
      status: FileStatus.ACTIVE,
      ...(nodeId ? { nodeId } : {}),
      ...(fileType ? { fileType: fileType as FileType } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [files, total] = await Promise.all([
      this.prisma.file.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { uploader: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.file.count({ where }),
    ]);

    return {
      files,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async deleteFile(fileId: string, organizationId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (!file) throw new NotFoundException();

    // Soft delete
    await this.prisma.file.update({
      where: { id: fileId },
      data: { status: FileStatus.DELETED, deletedAt: new Date() },
    });

    // Décrémenter stockage
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { storageUsedBytes: { decrement: file.sizeBytes } },
    });

    return { success: true };
  }

  private detectFileType(mimeType: string, filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';

    if (['glb'].includes(ext)) return 'GLB';
    if (['gltf'].includes(ext)) return 'GLTF';
    if (['obj'].includes(ext)) return 'OBJ';
    if (['ifc'].includes(ext)) return 'IFC';
    if (['dwg'].includes(ext)) return 'DWG';
    if (['dxf'].includes(ext)) return 'DXF';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.startsWith('video/')) return 'VIDEO';
    if (mimeType.startsWith('image/')) return 'IMAGE';

    return 'OTHER';
  }
}
