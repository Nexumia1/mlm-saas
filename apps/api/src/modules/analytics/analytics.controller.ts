import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard') getDashboard(@Request() req: any) {
    return this.analyticsService.getDashboardStats(req.user.tenantId);
  }

  @Post('track') trackEvent(@Request() req: any, @Body() dto: any) {
    return this.analyticsService.trackEvent(req.user.tenantId, dto);
  }
}
