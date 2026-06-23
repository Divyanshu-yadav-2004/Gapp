import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { NotificationGateway } from './notification.gateway';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, NotificationGateway],
  exports: [EmailService, NotificationGateway],
})
export class NotificationsModule {}
