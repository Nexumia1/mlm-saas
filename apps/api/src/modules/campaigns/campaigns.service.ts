import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  async getCampaigns(tenantId: string, query?: { platform?: string; status?: string }) {
    const where: any = { tenantId };
    if (query?.platform) where.platform = query.platform;
    if (query?.status) where.status = query.status;

    return this.prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        _count: { select: { leads: true } },
      },
    });
  }

  async createCampaign(tenantId: string, userId: string, dto: any) {
    return this.prisma.campaign.create({
      data: { tenantId, userId, ...dto },
    });
  }

  async updateCampaign(tenantId: string, id: string, dto: any) {
    const campaign = await this.prisma.campaign.findFirst({ where: { id, tenantId } });
    if (!campaign) throw new NotFoundException('Campaña no encontrada');
    return this.prisma.campaign.update({ where: { id }, data: dto });
  }

  async getCampaignStats(tenantId: string) {
    const [total, active, totalSpend, totalLeads] = await Promise.all([
      this.prisma.campaign.count({ where: { tenantId } }),
      this.prisma.campaign.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.campaign.aggregate({ where: { tenantId }, _sum: { spend: true } }),
      this.prisma.campaign.aggregate({ where: { tenantId }, _sum: { leads: true } }),
    ]);
    return { total, active, totalSpend: totalSpend._sum.spend || 0, totalLeads: totalLeads._sum.leads || 0 };
  }
}
