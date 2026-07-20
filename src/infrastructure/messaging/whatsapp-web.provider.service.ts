import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  pairingTimer?: ReturnType<typeof setTimeout>;
  idleTimer?: ReturnType<typeof setTimeout>;
}

@Injectable()
export class WhatsAppWebProviderService
  implements IMessagingProvider, OnModuleInit, OnModuleDestroy
{
  private readonly tenants = new Map<string, TenantSession>();
  private readonly logger = new Logger(WhatsAppWebProviderService.name);
  private readonly maxClients: number;
  private readonly qrTimeoutMs: number;
  private readonly idleTimeoutMs: number;

  constructor(config: ConfigService) {
    this.maxClients = Number(config.get('WHATSAPP_MAX_CLIENTS') ?? 5);
    this.qrTimeoutMs = Number(config.get('WHATSAPP_QR_TIMEOUT_MS') ?? 300_000);
    this.idleTimeoutMs = Number(
      config.get('WHATSAPP_IDLE_TIMEOUT_MS') ?? 1_800_000,
    );
  }

  async onModuleInit() {
    this.logger.log('WhatsAppWebProviderService inicializado (lazy init).');
  }

  async onModuleDestroy() {
    this.logger.log('Cerrando clientes de WhatsApp...');
    await Promise.all(
      [...this.tenants.entries()].map(([userId, tenant]) =>
        this.releaseTenant(userId, tenant, 'application shutdown'),
      ),
    );
  }

  async initialize(userId: string): Promise<void> {
    if (this.tenants.has(userId)) {
      this.touchTenant(userId, this.tenants.get(userId)!);
      return;
    }
    if (this.tenants.size >= this.maxClients) {
      throw new ServiceUnavailableException(
        'WhatsApp connection capacity is temporarily full',
      );
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
    this.touchTenant(userId, tenant);

    tenant.initPromise = tenant.client.initialize().catch(async (error) => {
      this.logger.error(`Error al inicializar WhatsApp para ${userId}`, error);
      await this.releaseTenant(userId, tenant, 'initialization failure');
    });
  }

  private registerEvents(userId: string, tenant: TenantSession) {
    tenant.client.on('qr', (qr) => {
      this.logger.log(`QR Code generado para ${userId}. Esperando escaneo...`);
      tenant.qrCode = qr;
      tenant.status = 'WAITING_QR';
      this.schedulePairingTimeout(userId, tenant);
      this.touchTenant(userId, tenant);
    });

    tenant.client.on('ready', () => {
      this.logger.log(`¡Cliente de WhatsApp conectado y listo para ${userId}!`);
      tenant.qrCode = null;
      tenant.status = 'CONNECTED';
      this.clearTimer(tenant.pairingTimer);
      tenant.pairingTimer = undefined;
      this.touchTenant(userId, tenant);
    });

    tenant.client.on('authenticated', () => {
      this.logger.log(`Autenticación de WhatsApp exitosa para ${userId}.`);
    });

    tenant.client.on('auth_failure', (msg) => {
      this.logger.error(
        `Fallo en la autenticación de WhatsApp para ${userId}`,
        msg,
      );
      void this.releaseTenant(userId, tenant, 'authentication failure');
    });

    tenant.client.on('disconnected', (reason) => {
      this.logger.warn(`WhatsApp desconectado para ${userId}`, reason);
      void this.releaseTenant(userId, tenant, 'remote disconnect');
    });
  }

  private async getOrInitTenant(userId: string): Promise<TenantSession> {
    if (!this.tenants.has(userId)) {
      await this.initialize(userId);
    }
    const tenant = this.tenants.get(userId);
    if (!tenant) {
      throw new ServiceUnavailableException(
        'WhatsApp connection could not be initialized',
      );
    }
    this.touchTenant(userId, tenant);
    return tenant;
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
      this.touchTenant(userId, tenant);
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

  private schedulePairingTimeout(userId: string, tenant: TenantSession): void {
    this.clearTimer(tenant.pairingTimer);
    tenant.pairingTimer = setTimeout(() => {
      void this.releaseTenant(userId, tenant, 'QR pairing timeout');
    }, this.qrTimeoutMs);
    tenant.pairingTimer.unref?.();
  }

  private touchTenant(userId: string, tenant: TenantSession): void {
    this.clearTimer(tenant.idleTimer);
    tenant.idleTimer = setTimeout(() => {
      void this.releaseTenant(userId, tenant, 'idle timeout');
    }, this.idleTimeoutMs);
    tenant.idleTimer.unref?.();
  }

  private async releaseTenant(
    userId: string,
    tenant: TenantSession,
    reason: string,
  ): Promise<void> {
    if (this.tenants.get(userId) !== tenant) return;
    this.tenants.delete(userId);
    this.clearTimer(tenant.pairingTimer);
    this.clearTimer(tenant.idleTimer);
    tenant.qrCode = null;
    tenant.status = 'DISCONNECTED';
    try {
      await tenant.client.destroy();
      this.logger.log(`Cliente WA liberado para ${userId}: ${reason}`);
    } catch (error) {
      this.logger.error(`Error liberando WA para ${userId}: ${reason}`, error);
    }
  }

  private clearTimer(timer?: ReturnType<typeof setTimeout>): void {
    if (timer) clearTimeout(timer);
  }
}
