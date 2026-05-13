import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import {
  IMessagingProvider,
  MessagingStatus,
} from '@domain/ports/messaging.provider.interface';

interface TenantSession {
  client: Client;
  qrCode: string | null;
  status: MessagingStatus;
  initPromise?: Promise<void>;
}

@Injectable()
export class WhatsAppWebProviderService
  implements IMessagingProvider, OnModuleInit, OnModuleDestroy
{
  private readonly tenants = new Map<string, TenantSession>();
  private readonly logger = new Logger(WhatsAppWebProviderService.name);

  constructor() {}

  async onModuleInit() {
    this.logger.log('WhatsAppWebProviderService inicializado (lazy init).');
  }

  async onModuleDestroy() {
    this.logger.log('Cerrando clientes de WhatsApp...');
    for (const [userId, tenant] of this.tenants.entries()) {
      try {
        await tenant.client.destroy();
        this.logger.log(`Cliente WA destruido para el usuario ${userId}`);
      } catch (err) {
        this.logger.error(`Error destruyendo WA para ${userId}`, err);
      }
    }
  }

  async initialize(userId: string): Promise<void> {
    if (this.tenants.has(userId)) {
      return;
    }

    const tenant: TenantSession = {
      client: new Client({
        authStrategy: new LocalAuth({ clientId: userId }),
        puppeteer: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      }),
      qrCode: null,
      status: 'INITIALIZING',
    };

    this.tenants.set(userId, tenant);
    this.registerEvents(userId, tenant);

    tenant.initPromise = tenant.client.initialize().catch((error) => {
      this.logger.error(`Error al inicializar WhatsApp para ${userId}`, error);
      tenant.status = 'DISCONNECTED';
    });
  }

  private registerEvents(userId: string, tenant: TenantSession) {
    tenant.client.on('qr', (qr) => {
      this.logger.log(`QR Code generado para ${userId}. Esperando escaneo...`);
      tenant.qrCode = qr;
      tenant.status = 'WAITING_QR';
    });

    tenant.client.on('ready', () => {
      this.logger.log(`¡Cliente de WhatsApp conectado y listo para ${userId}!`);
      tenant.qrCode = null;
      tenant.status = 'CONNECTED';
    });

    tenant.client.on('authenticated', () => {
      this.logger.log(`Autenticación de WhatsApp exitosa para ${userId}.`);
    });

    tenant.client.on('auth_failure', (msg) => {
      this.logger.error(
        `Fallo en la autenticación de WhatsApp para ${userId}`,
        msg,
      );
      tenant.status = 'DISCONNECTED';
    });

    tenant.client.on('disconnected', (reason) => {
      this.logger.warn(`WhatsApp desconectado para ${userId}`, reason);
      tenant.status = 'DISCONNECTED';
      tenant.qrCode = null;
    });
  }

  private async getOrInitTenant(userId: string): Promise<TenantSession> {
    if (!this.tenants.has(userId)) {
      await this.initialize(userId);
    }
    return this.tenants.get(userId)!;
  }

  async sendMessage(
    userId: string,
    phone: string,
    message: string,
  ): Promise<boolean> {
    const tenant = await this.getOrInitTenant(userId);
    if (tenant.status !== 'CONNECTED') {
      this.logger.warn(
        `Intento de envío fallido para ${userId}: WhatsApp no está conectado. Estado: ${tenant.status}`,
      );
      return false;
    }

    try {
      const cleanPhone = phone.replace('+', '');
      const chatId = `${cleanPhone}@c.us`;

      await tenant.client.sendMessage(chatId, message);
      this.logger.log(
        `Mensaje enviado correctamente a ${phone} por el usuario ${userId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Error enviando mensaje a ${phone} por ${userId}:`,
        error,
      );
      return false;
    }
  }

  async getQrCode(userId: string): Promise<string | null> {
    const tenant = await this.getOrInitTenant(userId);
    return tenant.qrCode;
  }

  async getStatus(userId: string): Promise<MessagingStatus> {
    const tenant = await this.getOrInitTenant(userId);
    return tenant.status;
  }
}
