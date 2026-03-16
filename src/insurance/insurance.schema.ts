import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InsuranceDocument = Insurance & Document;

@Schema()
export class Insurance {

  @Prop()
  name: string;

  @Prop()
  phone: string;

  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  })
  tuition: string;

  @Prop()
  type: string;

  @Prop()
  expirationDate: Date;

  @Prop({ default: false })
  reminderSent: boolean;
}

export const InsuranceSchema = SchemaFactory.createForClass(Insurance);