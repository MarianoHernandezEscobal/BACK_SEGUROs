import { Module } from '@nestjs/common';

import { ReminderCron } from './reminder.cron';
import { InsuranceModule } from '../insurance/insurance.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [InsuranceModule, WhatsappModule],
  providers: [ReminderCron],
})
export class CronModule {}