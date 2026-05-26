import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true, avatarUrl: true, lastLoginAt: true, createdAt: true,
        _count: { select: { assignedLeads: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async inviteUser(tenantId: string, dto: { email: string; firstName: string; lastName: string; role: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: dto.email } },
    });
    if (existing) throw new ConflictException('Este email ya está registrado en tu organización');

    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role as any,
        password: hashedPassword,
      },
    });

    // TODO: Enviar email de invitación con tempPassword
    return { user: { ...user, password: undefined }, tempPassword };
  }

  async toggleUserActive(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }
}
