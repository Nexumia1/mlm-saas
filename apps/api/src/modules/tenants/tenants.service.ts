import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async getTenantInfo(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { billing: true, _count: { select: { users: true, leads: true, campaigns: true } } },
    });
  }

  async updateTenant(tenantId: string, data: { name?: string; logoUrl?: string }) {
    return this.prisma.tenant.update({ where: { id: tenantId }, data });
  }
}
