import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { YapeQrImageService } from './yape-qr-image.service';

describe('YapeQrImageService', () => {
  const service = new YapeQrImageService();

  it('rejects text disguised as a PNG data URL', async () => {
    const disguised = `data:image/png;base64,${Buffer.from('not an image').toString('base64')}`;

    await expect(service.sanitize(disguised)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('decodes and re-encodes an allowed image as PNG', async () => {
    const input = await sharp({
      create: {
        width: 32,
        height: 32,
        channels: 3,
        background: '#ffffff',
      },
    })
      .webp()
      .toBuffer();

    const result = await service.sanitize(
      `data:image/webp;base64,${input.toString('base64')}`,
    );

    expect(result).toMatch(/^data:image\/png;base64,/);
    const output = Buffer.from(result.split(',')[1], 'base64');
    await expect(sharp(output).metadata()).resolves.toEqual(
      expect.objectContaining({ format: 'png', width: 32, height: 32 }),
    );
  });
});
