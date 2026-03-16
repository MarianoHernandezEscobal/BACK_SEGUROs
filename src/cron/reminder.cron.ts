import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { InsuranceService } from '../insurance/insurance.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class ReminderCron {

  constructor(
    private insuranceService: InsuranceService,
    private whatsappService: WhatsappService,
  ) { }

  /** Número o ID de grupo donde enviar el resumen diario (ej: "59895385147" o "120363xxx@g.us") */
  private readonly summaryRecipient = process.env.WHATSAPP_SUMMARY_TO ?? '59895385147';

  @Cron('0 9 * * *')
  async handleCron() {

    console.log('Ejecutando cron de seguros');

    const insurances =
      await this.insuranceService.getExpiringInsurances();

    const sent: Array<{ name: string; type: string; tuition: string; expirationDate: string }> = [];

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

      await this.insuranceService.markReminderSent(
        insurance._id.toString(),
      );

      sent.push({
        name: insurance.name,
        type: insurance.type,
        tuition: insurance.tuition,
        expirationDate: formattedDate,
      });
    }

    const summaryMessage = this.buildSummaryMessage(sent);
    await this.sendSummary(summaryMessage);
  }

  private buildSummaryMessage(
    sent: Array<{ name: string; type: string; tuition: string; expirationDate: string }>,
  ): string {
    const title = '📋 Resumen recordatorios de seguros\n';
    if (sent.length === 0) {
      return title + 'Hoy no había seguros por vencer en los próximos 7 días.';
    }
    const lines = sent.map(
      (s, i) =>
        `${i + 1}. ${s.name} — ${s.type} (${s.tuition}) vence ${s.expirationDate}`,
    );
    return title + `Se enviaron ${sent.length} recordatorio(s):\n\n` + lines.join('\n');
  }

  private async sendSummary(message: string) {
    const to = this.summaryRecipient.trim();
    if (to.includes('@g.us')) {
      await this.whatsappService.sendMessageToGroup(to, message);
    } else {
      await this.whatsappService.sendMessage(to, message);
    }
  }

  // cron para enviar mensaje todos los dias a las 8 a un numero fijo de whatsapp para validar que la app funciona
  @Cron('0 8 * * *')
  async handleCronValidation() {

    console.log('Ejecutando cron de validación');

    await this.whatsappService.sendMessage('59895385147', 'Hola, esta es una prueba de la app');

  }
}