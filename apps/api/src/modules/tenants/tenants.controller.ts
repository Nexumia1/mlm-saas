import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('me')
  getTenantInfo(@Request() req: any) {
    return this.tenantsService.getTenantInfo(req.user.tenantId);
  }

  @Patch('me')
  updateTenant(@Request() req: any, @Body() body: any) {
    return this.tenantsService.updateTenant(req.user.tenantId, body);
  }
}
