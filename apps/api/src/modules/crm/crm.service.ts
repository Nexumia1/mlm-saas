import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadStatus } from '@mlm-saas/database';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  // ═══════════════════════════════════════════
  // CONTACTOS
  // ═══════════════════════════════════════════

  async getContacts(tenantId: string, query: {
    search?: string;
    page?: number;
    limit?: number;
    source?: string;
    tags?: string[];
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 25, 100);
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    if (query.source) where.source = query.source;
    if (query.tags?.length) where.tags = { hasSome: query.tags };

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          leads: {
            select: { id: true, status: true, value: true },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      data: contacts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createContact(tenantId: string, dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: { tenantId, ...dto },
    });
  }

  async getContact(tenantId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, tenantId },
      include: {
        leads: {
          include: { assignedTo: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
        activities: { orderBy: { createdAt: 'desc' }, take: 20 },
        messages: { orderBy: { sentAt: 'desc' }, take: 10 },
      },
    });
    if (!contact) throw new NotFoundException('Contacto no encontrado');
    return contact;
  }

  // ═══════════════════════════════════════════
  // LEADS / PIPELINE
  // ═══════════════════════════════════════════

  async getLeads(tenantId: string, query: {
    search?: string;
    status?: LeadStatus;
    assignedToId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 25, 100);
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (query.status) where.status = query.status;
    if (query.assignedToId) where.assignedToId = query.assignedToId;
    if (query.search) {
      where.contact = {
        OR: [
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: true,
          assignedTo: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          campaign: { select: { id: true, name: true, platform: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPipelineKanban(tenantId: string) {
    const statuses = Object.values(LeadStatus);
    const pipeline = await Promise.all(
      statuses.map(async (status) => {
        const leads = await this.prisma.lead.findMany({
          where: { tenantId, status },
          include: {
            contact: { select: { firstName: true, lastName: true, phone: true } },
            assignedTo: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 50,
        });

        const totalValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);
        return { status, leads, count: leads.length, totalValue };
      }),
    );
    return pipeline;
  }

  async createLead(tenantId: string, userId: string, dto: CreateLeadDto) {
    // Si no hay contactId, crear contacto automáticamente
    let contactId = dto.contactId;

    if (!contactId && dto.contact) {
      const contact = await this.prisma.contact.create({
        data: { tenantId, ...dto.contact },
      });
      contactId = contact.id;
    }

    const lead = await this.prisma.lead.create({
      data: {
        tenantId,
        contactId: contactId!,
        createdById: userId,
        assignedToId: dto.assignedToId,
        title: dto.title,
        value: dto.value,
        source: dto.source,
        campaignId: dto.campaignId,
        notes: dto.notes,
      },
      include: {
        contact: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Registrar actividad
    await this.prisma.activity.create({
      data: {
        tenantId,
        userId,
        contactId: lead.contactId,
        leadId: lead.id,
        type: 'LEAD_CREATED',
        title: `Lead creado: ${lead.contact.firstName} ${lead.contact.lastName || ''}`,
      },
    });

    return lead;
  }

  async updateLead(tenantId: string, userId: string, id: string, dto: UpdateLeadDto) {
    const lead = await this.prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        ...dto,
        closedAt: dto.status === 'WON' || dto.status === 'LOST' ? new Date() : undefined,
      },
      include: {
        contact: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Log de cambio de estado
    if (dto.status && dto.status !== lead.status) {
      await this.prisma.activity.create({
        data: {
          tenantId,
          userId,
          leadId: id,
          contactId: lead.contactId,
          type: 'STATUS_CHANGE',
          title: `Estado cambiado a ${dto.status}`,
          metadata: { from: lead.status, to: dto.status },
        },
      });
    }

    return updated;
  }

  async getLeadStats(tenantId: string) {
    const [total, byStatus, totalValue, recentLeads] = await Promise.all([
      this.prisma.lead.count({ where: { tenantId } }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
        _sum: { value: true },
      }),
      this.prisma.lead.aggregate({
        where: { tenantId, status: 'WON' },
        _sum: { value: true },
      }),
      this.prisma.lead.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      total,
      byStatus,
      totalWonValue: totalValue._sum.value || 0,
      recentLeads,
    };
  }
}
