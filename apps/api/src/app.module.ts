import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProjectsModule } from './projects/projects.module';
import { NodesModule } from './nodes/nodes.module';
import { FilesModule } from './files/files.module';
import { ToursModule } from './tours/tours.module';
import { SharingModule } from './sharing/sharing.module';
import { MembersModule } from './members/members.module';
import { RolesModule } from './roles/roles.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    ProjectsModule,
    NodesModule,
    FilesModule,
    ToursModule,
    SharingModule,
    MembersModule,
    RolesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
