export const TOKEN_CIPHER = 'TOKEN_CIPHER';

export interface ITokenCipher {
  isConfigured(): boolean;
  encrypt(value: string, context: string): string;
  decrypt(value: string, context: string): string;
}
