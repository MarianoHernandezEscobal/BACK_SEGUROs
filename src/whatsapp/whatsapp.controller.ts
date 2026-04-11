import { Controller, Get } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {

  constructor(private readonly whatsappService: WhatsappService) {}

  /**
   * GET /whatsapp/auth/status
   * Respuesta para el front: `{ connected: true }` o `{ connected: false, qrDataUrl: "data:image/png;base64,..." }`.
   * CORS ya está habilitado en `main.ts` para llamar desde otro origen (puerto del front).
   */
  @Get('auth/status')
  async authStatus() {
    return this.whatsappService.getAuthStatus();
  }

  /**
   * GET /whatsapp/groups
   * Devuelve la lista de grupos con su ID (para usar en WHATSAPP_SUMMARY_TO).
   */
  @Get('groups')
  async getGroups() {
    return this.whatsappService.getGroups();
  }
}
