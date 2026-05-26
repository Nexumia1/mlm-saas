import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(tenantId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalLeads, leadsThisMonth, leadsLast7Days,
      wonLeads, totalCampaigns, activeCampaigns,
      totalSpend, totalContacts,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { tenantId } }),
      this.prisma.lead.count({ where: { tenantId, createdAt: { gte: startOfMonth } } }),
      this.prisma.lead.count({ where: { tenantId, createdAt: { gte: last7Days } } }),
      this.prisma.lead.aggregate({ where: { tenantId, status: 'WON' }, _sum: { value: true }, _count: true }),
      this.prisma.campaign.count({ where: { tenantId } }),
      this.prisma.campaign.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.campaign.aggregate({ where: { tenantId }, _sum: { spend: true, leads: true, conversions: true } }),
      this.prisma.contact.count({ where: { tenantId } }),
    ]);

    const conversionRate = totalLeads > 0 ? ((wonLeads._count / totalLeads) * 100).toFixed(1) : 0;
    const roi = totalSpend._sum.spend
      ? (((wonLeads._sum.value || 0) - totalSpend._sum.spend) / totalSpend._sum.spend * 100).toFixed(1)
      : 0;

    return {
      leads: { total: totalLeads, thisMonth: leadsThisMonth, last7Days: leadsLast7Days },
      conversions: { won: wonLeads._count, value: wonLeads._sum.value || 0, rate: Number(conversionRate) },
      campaigns: { total: totalCampaigns, active: activeCampaigns },
      spend: { total: totalSpend._sum.spend || 0, leads: totalSpend._sum.leads || 0 },
      contacts: { total: totalContacts },
      roi: Number(roi),
    };
  }

  async trackEvent(tenantId: string, dto: any) {
    return this.prisma.analyticsEvent.create({ data: { tenantId, ...dto } });
  }
}
