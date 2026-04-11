import { Injectable, OnModuleInit } from '@nestjs/common'
import { Client, LocalAuth } from 'whatsapp-web.js'
import * as qrcodeTerminal from 'qrcode-terminal'
import QRCode from 'qrcode'

@Injectable()
export class WhatsappService implements OnModuleInit {

  private client: Client
  private currentQr: string | null = null
  private clientReady = false

  async onModuleInit() {

    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      },
    })

    this.client.on('qr', (qr) => {
      this.currentQr = qr
      console.log('Escanea el QR con WhatsApp (el front puede usar GET /whatsapp/auth/status)')
      qrcodeTerminal.generate(qr, { small: true })
    })

    this.client.on('authenticated', () => {
      this.currentQr = null
    })

    this.client.on('ready', () => {
      this.clientReady = true
      this.currentQr = null
      console.log('✅ WhatsApp Web conectado')
    })

    await this.client.initialize()

  }

  /**
   * Para el front: poll cada ~1.5s hasta `connected: true`.
   * Mostrar `<img src={qrDataUrl} alt="WhatsApp" width={280} />` cuando venga `qrDataUrl`.
   */
  async getAuthStatus(): Promise<{ connected: boolean; qrDataUrl?: string }> {

    if (this.clientReady) {
      return { connected: true }
    }

    if (!this.currentQr) {
      return { connected: false }
    }

    const qrDataUrl = await QRCode.toDataURL(this.currentQr, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
    })

    return { connected: false, qrDataUrl }
  }

  async sendMessage(phone: string, message: string) {

    const chatId = `${phone}@c.us`

    await this.client.sendMessage(chatId, message)

  }

  /**
   * Envía un mensaje a un grupo de WhatsApp.
   * @param groupId ID del grupo (ej: "120363012345678901@g.us" o "120363012345678901")
   */
  async sendMessageToGroup(groupId: string, message: string) {

    const chatId = groupId.includes('@g.us') ? groupId : `${groupId}@g.us`

    await this.client.sendMessage(chatId, message)

  }

  /**
   * Lista todos los grupos de WhatsApp del usuario.
   * Útil para obtener el ID de un grupo (usar en WHATSAPP_SUMMARY_TO).
   */
  async getGroups(): Promise<Array<{ id: string; name: string }>> {

    const chats = await this.client.getChats()
    const groups = chats.filter((chat) => chat.isGroup)

    return groups.map((g) => ({
      id: typeof g.id === 'string' ? g.id : (g.id as { _serialized?: string })._serialized ?? String(g.id),
      name: g.name,
    }))
  }

}