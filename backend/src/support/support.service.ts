import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Role } from '../security/roles.enum';

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private messagesGateway: MessagesGateway,
  ) {}

  async createReport(userId: string, createReportDto: CreateReportDto) {
    const { targetId, type, reason, details } = createReportDto;

    let report;
    if (type === 'USER') {
      const targetUser = await this.prisma.user.findUnique({ where: { id: targetId } });
      if (!targetUser) throw new NotFoundException('Target user not found');
      
      report = await this.prisma.userReport.create({
        data: {
          reporterId: userId,
          targetId: targetId,
          reason,
          details,
          status: 'PENDING',
        },
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          target: { select: { id: true, name: true, email: true } },
        }
      });
    } else {
      const targetHouse = await this.prisma.house.findUnique({ where: { id: targetId } });
      if (!targetHouse) throw new NotFoundException('Target property not found');
      
      report = await this.prisma.propertyReport.create({
        data: {
          reporterId: userId,
          houseId: targetId,
          reason,
          details,
          status: 'PENDING',
        },
        include: {
          reporter: { select: { id: true, name: true, email: true } },
          house: { select: { id: true, name: true, address: true } },
        }
      });
    }

    // Notify Super Admins
    await this.messagesGateway.notifyAdminOfReport({
      ...report,
      reportType: type,
    });

    return report;
  }

  async createTicket(userId: string, createTicketDto: CreateTicketDto) {
    const { subject, message, priority } = createTicketDto;

    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        subject,
        status: 'OPEN',
        priority: priority || 'MEDIUM',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      }
    });

    // Create the first message in the ticket
    await this.prisma.message.create({
      data: {
        userId,
        ticketId: ticket.id,
        content: message,
        senderRole: Role.USER,
      }
    });

    // Notify Super Admins
    await this.messagesGateway.notifyAdminOfTicket(ticket);

    return ticket;
  }

  async getMyTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { messages: true } }
      }
    });
  }

  async getTicketDetails(userId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
           include: {
             user: { select: { id: true, name: true, avatarUrl: true } }
           },
           orderBy: { created_at: 'asc' }
        }
      }
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.userId !== userId) throw new BadRequestException('Unauthorized access to ticket');

    return ticket;
  }
}
