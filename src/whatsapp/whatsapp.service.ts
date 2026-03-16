import { Injectable, OnModuleInit } from '@nestjs/common'
import { Client, LocalAuth } from 'whatsapp-web.js'
import * as qrcode from 'qrcode-terminal'

@Injectable()
export class WhatsappService implements OnModuleInit {

  private client: Client

  async onModuleInit() {

    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        headless: true
      }
    })

    this.client.on('qr', (qr) => {
      console.log('Escanea el QR con WhatsApp')
      qrcode.generate(qr, { small: true })
    })

    this.client.on('ready', () => {
      console.log('✅ WhatsApp Web conectado')
    })

    await this.client.initialize()

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