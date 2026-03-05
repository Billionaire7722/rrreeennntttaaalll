import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { getJwtSecretOrThrow } from '../config/security.config';

@Module({
    imports: [
        PrismaModule,
        JwtModule.register({
            secret: getJwtSecretOrThrow(),
        }),
    ],
    providers: [MessagesGateway],
    exports: [MessagesGateway],
})
export class MessagesModule {}
