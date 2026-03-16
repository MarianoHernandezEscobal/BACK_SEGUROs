import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Insurance, InsuranceSchema } from './insurance.schema';
import { InsuranceService } from './insurance.service';
import { WhatsappModule } from 'src/whatsapp/whatsapp.module';
import { InsuranceController } from './insurance.controller';

@Module({
  imports: [
    WhatsappModule,
    MongooseModule.forFeature([
      { name: Insurance.name, schema: InsuranceSchema }
    ])
  ],
  providers: [InsuranceService],
  controllers: [InsuranceController],
  exports: [InsuranceService],
})
export class InsuranceModule {}