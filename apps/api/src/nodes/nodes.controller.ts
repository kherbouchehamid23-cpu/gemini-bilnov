import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { NodesService } from './nodes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateNodeDto {
  @IsOptional() @IsString() parentId?: string;
  @IsString() name!: string;
  @IsOptional() @IsString() nodeType?: string;
  @IsOptional() @IsNumber() position?: number;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  @Get('projects/:projectId/nodes')
  async getTree(@Param('projectId') projectId: string) {
    const tree = await this.nodesService.getTree(projectId);
    return { success: true, data: tree };
  }

  @Post('projects/:projectId/nodes')
  async create(@Param('projectId') projectId: string, @Body() dto: CreateNodeDto) {
    const node = await this.nodesService.create({ ...dto, projectId });
    return { success: true, data: node };
  }

  @Patch('nodes/:id')
  async update(@Param('id') id: string, @Body() dto: { name?: string; position?: number }) {
    const node = await this.nodesService.update(id, dto);
    return { success: true, data: node };
  }

  @Delete('nodes/:id')
  async remove(@Param('id') id: string) {
    await this.nodesService.remove(id);
    return { success: true, data: { message: 'Nœud supprimé' } };
  }
}
