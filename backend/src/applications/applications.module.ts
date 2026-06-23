import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [NotificationsModule, ConfigModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
