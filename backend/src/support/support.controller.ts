import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('report')
  async createReport(@Request() req, @Body() createReportDto: CreateReportDto) {
    return this.supportService.createReport(req.user.userId, createReportDto);
  }

  @Post('tickets')
  async createTicket(@Request() req, @Body() createTicketDto: CreateTicketDto) {
    return this.supportService.createTicket(req.user.userId, createTicketDto);
  }

  @Get('tickets')
  async getMyTickets(@Request() req) {
    return this.supportService.getMyTickets(req.user.userId);
  }

  @Get('tickets/:id')
  async getTicketDetails(@Request() req, @Param('id') id: string) {
    return this.supportService.getTicketDetails(req.user.userId, id);
  }
}
