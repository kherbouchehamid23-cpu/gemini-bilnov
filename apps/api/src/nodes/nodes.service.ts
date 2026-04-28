import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NodesService {
  constructor(private readonly prisma: PrismaService) {}

  async getTree(projectId: string) {
    const nodes = await this.prisma.projectStructureNode.findMany({
      where: { projectId },
      include: { _count: { select: { files: true, tours: true } } },
      orderBy: { position: 'asc' },
    });

    const buildTree = (parentId: string | null): any[] =>
      nodes
        .filter((n) => n.parentId === parentId)
        .map((n) => ({ ...n, children: buildTree(n.id) }));

    return buildTree(null);
  }

  async create(dto: {
    projectId: string;
    parentId?: string;
    name: string;
    nodeType?: string;
    position?: number;
  }) {
    return this.prisma.projectStructureNode.create({ data: dto });
  }

  async update(id: string, dto: { name?: string; position?: number }) {
    return this.prisma.projectStructureNode.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.projectStructureNode.delete({ where: { id } });
  }
}
