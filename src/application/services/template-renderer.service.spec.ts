import { BadRequestException } from '@nestjs/common';
import { TemplateRendererService } from './template-renderer.service';

describe('TemplateRendererService', () => {
  const service = new TemplateRendererService();

  it('renders every supported variable and repeated occurrences', () => {
    expect(service.render('Hola {{name}}, {{name}}. Cita: {{date}}. Pago: {{paymentUrl}}', {
      name: 'Andrea', date: '15 de julio', paymentUrl: 'https://pago.test/1',
    })).toBe('Hola Andrea, Andrea. Cita: 15 de julio. Pago: https://pago.test/1');
  });

  it.each(['{{nombre}}', '{{ name }}', 'Hola {{name'])('rejects invalid syntax: %s', (template) => {
    expect(service.validate(template).valid).toBe(false);
  });

  it('blocks rendering when a used value is missing', () => {
    expect(() => service.render('Paga aquí: {{paymentUrl}}', {})).toThrow(BadRequestException);
  });

  it('uses replacement values literally', () => {
    expect(service.render('Hola {{name}}', { name: '$& Andrea' })).toBe('Hola $& Andrea');
  });

  it('returns a human-readable preview', () => {
    const result = service.preview('Hola {{name}}, tu cita es el {{date}}');
    expect(result.validation.valid).toBe(true);
    expect(result.message).toContain('Andrea');
    expect(result.message).not.toContain('{{');
  });
});
