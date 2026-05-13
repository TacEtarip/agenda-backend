import { Controller, Get, Inject, UseGuards, Request } from '@nestjs/common';
import {
  MESSAGING_PROVIDER,
  MessagingStatus,
} from '@domain/ports/messaging.provider.interface';
import type { IMessagingProvider } from '@domain/ports/messaging.provider.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppController {
  constructor(
    @Inject(MESSAGING_PROVIDER)
    private readonly messagingProvider: IMessagingProvider,
  ) {}

  @Get('status')
  async getStatus(
    @Request() req: Express.Request & { user: { userId: string } },
  ): Promise<{ status: MessagingStatus }> {
    const status = await this.messagingProvider.getStatus(req.user.userId);
    return { status };
  }

  @Get('qr')
  async getQrCode(
    @Request() req: Express.Request & { user: { userId: string } },
  ): Promise<{ qr: string | null }> {
    const qr = await this.messagingProvider.getQrCode(req.user.userId);
    return { qr };
  }
}
