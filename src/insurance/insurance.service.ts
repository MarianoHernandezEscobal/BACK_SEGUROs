import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Insurance, InsuranceDocument } from './insurance.schema';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { InsuranceDTO } from './dto/insurance.dto';

@Injectable()
export class InsuranceService {

  constructor(
    @InjectModel(Insurance.name)
    private insuranceModel: Model<InsuranceDocument>,
    private whatsappService: WhatsappService,
  ) { }


  async create(data: InsuranceDTO) {
    try {
      data.phone = this.formatPhone(data.phone)
      const insurance = new this.insuranceModel(data);
      return await insurance.save();
    } catch (e) {
      if (e.code === 11000) {
        throw new BadRequestException('La matrícula ya está registrada');
      }
      throw e;
    }
  }

  async update(id: string, data: Partial<InsuranceDTO>) {
    try {

      if (data.phone) {
        data.phone = this.formatPhone(data.phone);
      }

      // Si cambian la fecha de vencimiento, reiniciar recordatorio
      if (data.expirationDate) {
        (data as any).reminderSent = false;
      }

      const insurance = await this.insuranceModel.findByIdAndUpdate(
        id,
        data,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!insurance) {
        throw new BadRequestException('Seguro no encontrado');
      }

      return insurance;

    } catch (e) {

      if (e.code === 11000) {
        throw new ConflictException('La matrícula ya está registrada');
      }

      throw e;

    }
  }

  private formatPhone(phone: string): string {

    if (!phone) return phone;
    phone = phone.replace(/\s+/g, '')
      .replace('-', '')
      .replace('+', '');
    if (phone.startsWith('0')) {
      phone = phone.substring(1);
    }
    if (!phone.startsWith('598')) {
      phone = `598${phone}`;
    }
    return phone;
  }

  async findAll() {
    return this.insuranceModel.find();
  }
  // Seguros por vencer (en los próximos 7 días) o ya vencidos
  async getExpiringInsurances() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const limitDate = new Date(today);
    limitDate.setDate(limitDate.getDate() + 7);
    limitDate.setHours(23, 59, 59, 999);

    return this.insuranceModel.find({
      expirationDate: { $lte: limitDate },
      reminderSent: { $ne: true }, // incluye false o cuando el campo no existe (documentos antiguos)
    });
  }

  async markReminderSent(id: string) {
    await this.insuranceModel.findByIdAndUpdate(id, {
      reminderSent: true,
    });
  }

  async reminder() {
    const insurances = await this.getExpiringInsurances();

    for (const insurance of insurances) {

      const date = new Date(insurance.expirationDate);

      const formattedDate = date.toLocaleDateString('es-UY', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const message = `Hola ${insurance.name} 👋

Tu seguro de ${insurance.type}
Matrícula: ${insurance.tuition}
📅 Vence: ${formattedDate}

Por favor recuerda pagarlo a tiempo.`;

      await this.whatsappService.sendMessage(
        insurance.phone,
        message,
      );

      await this.markReminderSent(
        insurance._id.toString(),
      );
    }

    return {
      message: 'Recordatorios enviados',
    };
  }
  async findOne(id: string) {
    const insurance = await this.insuranceModel.findById(id);
    if (!insurance) {
      throw new BadRequestException('Seguro no encontrado');
    }
    return insurance;
  }

}