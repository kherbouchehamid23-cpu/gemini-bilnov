import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PLAN_LIMITS, ErrorCode } from '@bilnov/shared';
import { ProjectStatus, StructureType } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: {
    name: string;
    description?: string;
    structureType?: StructureType;
    sector?: string;
    organizationId: string;
    createdById: string;
  }) {
    // Vérifier la limite du plan
    const org = await this.prisma.organization.findUnique({ where: { id: dto.organizationId } });
    if (org) {
      const limits = PLAN_LIMITS[org.plan];
      if (limits.maxProjects !== Infinity) {
        const count = await this.prisma.project.count({
          where: { organizationId: dto.organizationId, deletedAt: null },
        });
        if (count >= limits.maxProjects) {
          throw new ForbiddenException({
            code: ErrorCode.PLAN_LIMIT_REACHED,
            message: `Votre plan est limité à ${limits.maxProjects} projet(s). Passez à un plan supérieur.`,
          });
        }
      }
    }

    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        structureType: dto.structureType ?? StructureType.BUILDING,
        sector: dto.sector,
        organizationId: dto.organizationId,
        createdById: dto.createdById,
      },
    });
  }

  async findAll(organizationId: string, page = 1, limit = 20) {
    const where = { organizationId, deletedAt: null };
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { files: true, tours: true, members: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);
    return { projects, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        _count: { select: { files: true, tours: true, members: true } },
      },
    });
    if (!project) throw new NotFoundException({ code: ErrorCode.NOT_FOUND });
    return project;
  }

  async update(id: string, organizationId: string, dto: { name?: string; description?: string; sector?: string }) {
    const project = await this.findOne(id, organizationId);
    return this.prisma.project.update({ where: { id: project.id }, data: dto });
  }

  async remove(id: string, organizationId: string) {
    const project = await this.findOne(id, organizationId);
    return this.prisma.project.update({
      where: { id: project.id },
      data: { deletedAt: new Date(), status: ProjectStatus.DELETED },
    });
  }
}
