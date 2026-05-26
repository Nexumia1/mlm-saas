import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('AGENCY_ADMIN' as any, 'MLM_LEADER' as any)
  getUsers(@Request() req: any) {
    return this.usersService.getUsers(req.user.tenantId);
  }

  @Post('invite')
  @Roles('AGENCY_ADMIN' as any)
  inviteUser(@Request() req: any, @Body() dto: any) {
    return this.usersService.inviteUser(req.user.tenantId, dto);
  }

  @Patch(':id/toggle-active')
  @Roles('AGENCY_ADMIN' as any)
  toggleActive(@Request() req: any, @Param('id') id: string) {
    return this.usersService.toggleUserActive(req.user.tenantId, id);
  }
}
