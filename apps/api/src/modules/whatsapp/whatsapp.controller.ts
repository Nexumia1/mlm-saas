import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('whatsapp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('whatsapp')
export class WhatsappController {
  constructor(private whatsappService: WhatsappService) {}

  @Get('accounts') getAccounts(@Request() req: any) {
    return this.whatsappService.getAccounts(req.user.tenantId);
  }

  @Get('conversations/:accountId') getConversations(@Request() req: any, @Param('accountId') accountId: string) {
    return this.whatsappService.getConversations(req.user.tenantId, accountId);
  }

  @Post('send') sendMessage(@Request() req: any, @Body() dto: any) {
    return this.whatsappService.sendMessage(req.user.tenantId, dto);
  }

  @Public()
  @Post('webhook') handleWebhook(@Body() body: any, @Query('hub.challenge') challenge: string) {
    if (challenge) return challenge; // Verificación del webhook
    return this.whatsappService.handleWebhook(body);
  }

  @Public()
  @Get('webhook') verifyWebhook(@Query() query: any) {
    const mode = query['hub.mode'];
    const token = query['hub.verify_token'];
    const challenge = query['hub.challenge'];
    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_TOKEN) return parseInt(challenge);
    return 403;
  }
}
