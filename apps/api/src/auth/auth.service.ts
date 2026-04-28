import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ErrorCode } from '@bilnov/shared';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({
        code: ErrorCode.EMAIL_ALREADY_EXISTS,
        message: 'Un compte existe déjà avec cet email',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    const org = await this.prisma.organization.create({
      data: {
        name: `${dto.firstName} ${dto.lastName}`,
        ownerId: user.id,
        planExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    // Rôle owner système
    await this.prisma.role.create({
      data: {
        organizationId: org.id,
        name: 'owner',
        isSystem: true,
        createdById: user.id,
      },
    });

    return this.generateTokens(user.id, user.email, org.id);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Email ou mot de passe incorrect',
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Email ou mot de passe incorrect',
      });
    }

    const org = await this.prisma.organization.findUnique({ where: { ownerId: user.id } });

    return this.generateTokens(user.id, user.email, org?.id ?? '');
  }

  async refreshTokens(userId: string, tokenHash: string) {
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId, revokedAt: null },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Session expirée, veuillez vous reconnecter',
      });
    }

    const valid = await bcrypt.compare(tokenHash, stored.tokenHash);
    if (!valid) {
      throw new UnauthorizedException({ code: ErrorCode.UNAUTHORIZED, message: 'Token invalide' });
    }

    // Révoquer l'ancien token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const org = await this.prisma.organization.findUnique({ where: { ownerId: userId } });
    return this.generateTokens(userId, stored.user.email, org?.id ?? '');
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      organizationId: user.organization?.id ?? null,
      organizationName: user.organization?.name ?? null,
      plan: user.organization?.plan ?? 'TRIAL',
    };
  }

  private async generateTokens(userId: string, email: string, organizationId: string) {
    const accessToken = this.jwt.sign(
      { sub: userId, email, organizationId },
      { expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m') },
    );

    const rawRefreshToken = randomUUID();
    const tokenHash = await bcrypt.hash(rawRefreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: {
        id: userId,
        email,
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
        avatarUrl: user?.avatarUrl ?? null,
        organizationId,
        organizationName: user?.organization?.name ?? '',
        plan: user?.organization?.plan ?? 'TRIAL',
      },
    };
  }
}
