import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController, OrdersController } from './payments.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [NotificationsModule, ConfigModule],
  controllers: [PaymentsController, OrdersController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

