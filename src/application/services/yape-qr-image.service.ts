import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';

const MAX_QR_BYTES = 256 * 1024;
const MAX_QR_DIMENSION = 2048;
const MAX_QR_PIXELS = 4_000_000;

const MIME_BY_FORMAT = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const;

type AllowedFormat = keyof typeof MIME_BY_FORMAT;

@Injectable()
export class YapeQrImageService {
  async sanitize(dataUrl: string): Promise<string> {
    try {
      const match =
        /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
          dataUrl,
        );
      if (!match || match[2].length % 4 !== 0) {
        throw new BadRequestException('Yape QR must be a valid base64 image');
      }

      const input = Buffer.from(match[2], 'base64');
      if (
        input.length === 0 ||
        input.length > MAX_QR_BYTES ||
        input.toString('base64') !== match[2]
      ) {
        throw new BadRequestException('Yape QR exceeds the allowed size');
      }

      const detectedFormat = this.detectFormat(input);
      if (!detectedFormat || MIME_BY_FORMAT[detectedFormat] !== match[1]) {
        throw new BadRequestException(
          'Yape QR content does not match its declared image type',
        );
      }

      const image = sharp(input, {
        failOn: 'warning',
        limitInputPixels: MAX_QR_PIXELS,
        sequentialRead: true,
      });
      const metadata = await image.metadata();
      if (
        metadata.format !== detectedFormat ||
        !metadata.width ||
        !metadata.height ||
        metadata.width > MAX_QR_DIMENSION ||
        metadata.height > MAX_QR_DIMENSION ||
        metadata.width * metadata.height > MAX_QR_PIXELS ||
        (metadata.pages ?? 1) !== 1
      ) {
        throw new BadRequestException('Yape QR image dimensions are invalid');
      }

      const sanitized = await image
        .rotate()
        .png({ compressionLevel: 9, palette: true })
        .toBuffer();
      if (sanitized.length > MAX_QR_BYTES) {
        throw new BadRequestException(
          'Sanitized Yape QR exceeds the allowed size',
        );
      }

      return `data:image/png;base64,${sanitized.toString('base64')}`;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Yape QR is not a valid image');
    }
  }

  private detectFormat(input: Buffer): AllowedFormat | null {
    if (
      input.length >= 8 &&
      input.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    ) {
      return 'png';
    }
    if (
      input.length >= 3 &&
      input[0] === 0xff &&
      input[1] === 0xd8 &&
      input[2] === 0xff
    ) {
      return 'jpeg';
    }
    if (
      input.length >= 12 &&
      input.subarray(0, 4).toString('ascii') === 'RIFF' &&
      input.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'webp';
    }
    return null;
  }
}
