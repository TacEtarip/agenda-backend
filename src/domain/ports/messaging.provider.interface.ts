export const MESSAGING_PROVIDER = 'MESSAGING_PROVIDER';

export type MessagingStatus =
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'WAITING_QR'
  | 'INITIALIZING';

export interface IMessagingProvider {
  /**
   * Inicializa el cliente de mensajería para un usuario
   */
  initialize(userId: string): Promise<void>;

  /**
   * Envía un mensaje a un número específico desde la cuenta de un usuario
   * @param userId ID del usuario emisor
   * @param phone Número de teléfono (ej. +51999888777)
   * @param message Contenido del mensaje
   */
  sendMessage(userId: string, phone: string, message: string): Promise<boolean>;

  /**
   * Obtiene el código QR actual de un usuario (si se requiere escaneo)
   */
  getQrCode(userId: string): Promise<string | null>;

  /**
   * Obtiene el estado actual de la conexión de un usuario
   */
  getStatus(userId: string): Promise<MessagingStatus>;
}
