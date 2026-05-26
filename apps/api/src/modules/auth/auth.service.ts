import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@mlm-saas/database';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  // ─────────────────────────────────────────
  // REGISTRO — Crea tenant + usuario admin
  // ─────────────────────────────────────────
  async register(dto: RegisterDto) {
    // Verificar si el slug ya existe
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existingTenant) {
      throw new ConflictException('Este nombre de empresa ya está en uso');
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Crear tenant y admin en una transacción
    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.companyName,
          slug: dto.slug,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.AGENCY_ADMIN,
          emailVerified: false,
        },
      });

      // Crear billing (trial por 14 días)
      await tx.billing.create({
        data: {
          tenantId: tenant.id,
          status: 'TRIAL',
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      return { tenant, user };
    });

    this.logger.log(`✅ Nuevo registro: ${result.user.email} — Tenant: ${result.tenant.slug}`);

    // Generar tokens
    const tokens = await this.generateTokens(result.user.id, result.user.tenantId, result.user.role);

    return {
      user: this.sanitizeUser(result.user),
      tenant: result.tenant,
      ...tokens,
    };
  }

  // ─────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user || !await bcrypt.compare(dto.password, user.password)) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tu cuenta está desactivada');
    }

    if (!user.tenant.isActive) {
      throw new UnauthorizedException('Tu organización está suspendida');
    }

    // Actualizar último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.tenantId, user.role);

    return {
      user: this.sanitizeUser(user),
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
        logoUrl: user.tenant.logoUrl,
      },
      ...tokens,
    };
  }

  // ─────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────
  async refreshTokens(refreshToken: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { tenant: true } } },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Rotar el refresh token (one-time use)
    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    const tokens = await this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.tenantId,
      tokenRecord.user.role,
    );

    return { ...tokens };
  }

  // ─────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: { userId, token: refreshToken },
      });
    } else {
      // Logout de todos los dispositivos
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    return { message: 'Sesión cerrada exitosamente' };
  }

  // ─────────────────────────────────────────
  // OBTENER PERFIL
  // ─────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          include: { billing: true },
        },
      },
    });

    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    return {
      user: this.sanitizeUser(user),
      tenant: user.tenant,
    };
  }

  // ─────────────────────────────────────────
  // HELPERS PRIVADOS
  // ─────────────────────────────────────────
  private async generateTokens(userId: string, tenantId: string, role: string) {
    const payload = { sub: userId, tenantId, role };

    const accessToken = this.jwtService.sign(payload);

    // Refresh token: 30 días
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '30d',
    });

    // Guardar refresh token en DB
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
  }
}
