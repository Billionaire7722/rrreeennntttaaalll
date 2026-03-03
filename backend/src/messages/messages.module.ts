import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'default-secret',
        }),
    ],
    providers: [MessagesGateway],
    exports: [MessagesGateway],
})
export class MessagesModule {}
