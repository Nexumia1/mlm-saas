import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private prisma: PrismaService) {}

  async getAccounts(tenantId: string) {
    return this.prisma.whatsAppAccount.findMany({ where: { tenantId } });
  }

  async getConversations(tenantId: string, accountId: string) {
    return this.prisma.whatsAppConversation.findMany({
      where: { accountId, account: { tenantId } },
      include: {
        messages: { orderBy: { sentAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async sendMessage(tenantId: string, dto: {
    accountId: string;
    to: string;
    type: 'text' | 'template';
    content: string;
    templateName?: string;
  }) {
    const account = await this.prisma.whatsAppAccount.findFirst({
      where: { id: dto.accountId, tenantId },
    });
    if (!account) throw new Error('Cuenta de WhatsApp no encontrada');

    // Llamada a la API de WhatsApp Business
    const payload = dto.type === 'text'
      ? { messaging_product: 'whatsapp', to: dto.to, type: 'text', text: { body: dto.content } }
      : { messaging_product: 'whatsapp', to: dto.to, type: 'template',
          template: { name: dto.templateName, language: { code: 'es' } } };

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v20.0/${account.phoneNumberId}/messages`,
        payload,
        { headers: { Authorization: `Bearer ${account.accessToken}`, 'Content-Type': 'application/json' } },
      );

      this.logger.log(`✅ Mensaje enviado a ${dto.to}`);

      // Guardar en DB
      let conv = await this.prisma.whatsAppConversation.findFirst({
        where: { accountId: dto.accountId, phoneNumber: dto.to },
      });
      if (!conv) {
        conv = await this.prisma.whatsAppConversation.create({
          data: { accountId: dto.accountId, phoneNumber: dto.to },
        });
      }

      await this.prisma.whatsAppMessage.create({
        data: {
          conversationId: conv.id,
          direction: 'OUTBOUND',
          type: dto.type === 'template' ? 'TEMPLATE' : 'TEXT',
          content: dto.content,
          externalId: response.data.messages?.[0]?.id,
          status: 'SENT',
        },
      });

      await this.prisma.whatsAppConversation.update({
        where: { id: conv.id },
        data: { lastMessageAt: new Date() },
      });

      return { success: true, messageId: response.data.messages?.[0]?.id };
    } catch (error: any) {
      this.logger.error('Error enviando mensaje WhatsApp:', error.response?.data);
      throw error;
    }
  }

  // Webhook para recibir mensajes entrantes
  async handleWebhook(body: any) {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      for (const message of value.messages) {
        this.logger.log(`📱 Mensaje recibido de ${message.from}: ${message.text?.body}`);
        // TODO: Procesar y guardar mensaje, disparar automatizaciones
      }
    }
  }
}
