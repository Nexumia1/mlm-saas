import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get() getCampaigns(@Request() req: any, @Query() query: any) {
    return this.campaignsService.getCampaigns(req.user.tenantId, query);
  }

  @Get('stats') getStats(@Request() req: any) {
    return this.campaignsService.getCampaignStats(req.user.tenantId);
  }

  @Post() createCampaign(@Request() req: any, @Body() dto: any) {
    return this.campaignsService.createCampaign(req.user.tenantId, req.user.id, dto);
  }

  @Patch(':id') updateCampaign(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.campaignsService.updateCampaign(req.user.tenantId, id, dto);
  }
}
