import { Module } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { getJwtSecretOrThrow } from '../config/security.config';
import { PresenceModule } from '../presence/presence.module';

@Module({
    imports: [
        PrismaModule,
        PresenceModule,
        JwtModule.register({
            secret: getJwtSecretOrThrow(),
        }),
    ],
    providers: [MessagesGateway],
    exports: [MessagesGateway],
})
export class MessagesModule {}
