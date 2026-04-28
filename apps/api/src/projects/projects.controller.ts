import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { StructureType } from '@prisma/client';

export class CreateProjectDto {
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(StructureType) structureType?: StructureType;
  @IsOptional() @IsString() sector?: string;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() sector?: string;
}

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: { sub: string; organizationId: string },
  ) {
    const project = await this.projectsService.create({
      ...dto,
      organizationId: user.organizationId,
      createdById: user.sub,
    });
    return { success: true, data: project };
  }

  @Get()
  async findAll(
    @CurrentUser() user: { organizationId: string },
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const result = await this.projectsService.findAll(
      user.organizationId, parseInt(page), parseInt(limit),
    );
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    const project = await this.projectsService.findOne(id, user.organizationId);
    return { success: true, data: project };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: { organizationId: string },
  ) {
    const project = await this.projectsService.update(id, user.organizationId, dto);
    return { success: true, data: project };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { organizationId: string },
  ) {
    await this.projectsService.remove(id, user.organizationId);
    return { success: true, data: { message: 'Projet supprimé' } };
  }
}
