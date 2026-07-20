import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface MockWhatsAppClient {
  handlers: Map<string, (...args: unknown[]) => void>;
  initialize: jest.Mock<Promise<void>, []>;
  destroy: jest.Mock<Promise<void>, []>;
  sendMessage: jest.Mock<Promise<void>, [string, string]>;
  on: jest.Mock;
  emit(event: string, ...args: unknown[]): void;
}

const mockClients: MockWhatsAppClient[] = [];

jest.mock('whatsapp-web.js', () => ({
  LocalAuth: jest.fn(),
  Client: jest.fn().mockImplementation(() => {
    const handlers = new Map<string, (...args: unknown[]) => void>();
    const client: MockWhatsAppClient = {
      handlers,
      initialize: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
      sendMessage: jest.fn().mockResolvedValue(undefined),
      on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
        handlers.set(event, handler);
      }),
      emit(event: string, ...args: unknown[]) {
        handlers.get(event)?.(...args);
      },
    };
    mockClients.push(client);
    return client;
  }),
}));

import { WhatsAppWebProviderService } from './whatsapp-web.provider.service';

describe('WhatsAppWebProviderService resource limits', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockClients.length = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const createService = (maxClients = 1, qrTimeoutMs = 50) => {
    const values: Record<string, number> = {
      WHATSAPP_MAX_CLIENTS: maxClients,
      WHATSAPP_QR_TIMEOUT_MS: qrTimeoutMs,
      WHATSAPP_IDLE_TIMEOUT_MS: 60_000,
    };
    const config = {
      get: jest.fn((key: string) => values[key]),
    } as unknown as ConfigService;
    return new WhatsAppWebProviderService(config);
  };

  it('enforces a process-wide client quota across distinct users', async () => {
    const service = createService(1);
    await service.initialize('user-a');

    await expect(service.initialize('user-b')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(mockClients).toHaveLength(1);
    await service.onModuleDestroy();
  });

  it('destroys an unpaired client after the QR timeout and frees capacity', async () => {
    const service = createService(1, 25);
    await service.initialize('user-a');
    mockClients[0].emit('qr', 'qr-code');

    await jest.advanceTimersByTimeAsync(25);

    expect(mockClients[0].destroy).toHaveBeenCalledTimes(1);
    await expect(service.initialize('user-b')).resolves.toBeUndefined();
    expect(mockClients).toHaveLength(2);
    await service.onModuleDestroy();
  });
});
