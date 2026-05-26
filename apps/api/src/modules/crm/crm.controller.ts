import {
  Controller, Get, Post, Patch, Param, Body,
  Query, UseGuards, Request, ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CrmService } from './crm.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { LeadStatus } from '@mlm-saas/database';

@ApiTags('crm')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crm')
export class CrmController {
  constructor(private crmService: CrmService) {}

  // ─── CONTACTOS ───────────────────────────
  @Get('contacts')
  @ApiOperation({ summary: 'Listar contactos del tenant' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getContacts(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit?: number,
    @Query('source') source?: string,
  ) {
    return this.crmService.getContacts(req.user.tenantId, { search, page, limit, source });
  }

  @Post('contacts')
  @ApiOperation({ summary: 'Crear contacto' })
  createContact(@Request() req: any, @Body() dto: CreateContactDto) {
    return this.crmService.createContact(req.user.tenantId, dto);
  }

  @Get('contacts/:id')
  @ApiOperation({ summary: 'Obtener contacto con historial' })
  getContact(@Request() req: any, @Param('id') id: string) {
    return this.crmService.getContact(req.user.tenantId, id);
  }

  // ─── LEADS ───────────────────────────────
  @Get('leads')
  @ApiOperation({ summary: 'Listar leads' })
  getLeads(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('status') status?: LeadStatus,
    @Query('assignedToId') assignedToId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(25), ParseIntPipe) limit?: number,
  ) {
    return this.crmService.getLeads(req.user.tenantId, { search, status, assignedToId, page, limit });
  }

  @Get('leads/pipeline')
  @ApiOperation({ summary: 'Vista Kanban del pipeline' })
  getPipeline(@Request() req: any) {
    return this.crmService.getPipelineKanban(req.user.tenantId);
  }

  @Get('leads/stats')
  @ApiOperation({ summary: 'Estadísticas de leads' })
  getLeadStats(@Request() req: any) {
    return this.crmService.getLeadStats(req.user.tenantId);
  }

  @Post('leads')
  @ApiOperation({ summary: 'Crear lead' })
  createLead(@Request() req: any, @Body() dto: CreateLeadDto) {
    return this.crmService.createLead(req.user.tenantId, req.user.id, dto);
  }

  @Patch('leads/:id')
  @ApiOperation({ summary: 'Actualizar lead (estado, asignación, valor...)' })
  updateLead(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.crmService.updateLead(req.user.tenantId, req.user.id, id, dto);
  }
}
