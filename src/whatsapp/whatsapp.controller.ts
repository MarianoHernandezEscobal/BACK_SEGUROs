import { Controller, Get } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {

  constructor(private readonly whatsappService: WhatsappService) {}

  /**
   * GET /whatsapp/groups
   * Devuelve la lista de grupos con su ID (para usar en WHATSAPP_SUMMARY_TO).
   */
  @Get('groups')
  async getGroups() {
    return this.whatsappService.getGroups();
  }
}
