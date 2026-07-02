import { BadRequestException, Injectable } from '@nestjs/common';
import {
  TEMPLATE_VARIABLES,
  TemplateValidationResult,
  TemplateVariableKey,
  validateTemplate,
} from './template-variable.registry';

export type TemplateVariables = Partial<Record<TemplateVariableKey, string>>;

@Injectable()
export class TemplateRendererService {
  getMetadata() {
    return TEMPLATE_VARIABLES;
  }

  validate(templateText: string): TemplateValidationResult {
    return validateTemplate(templateText);
  }

  render(templateText: string, variables: TemplateVariables): string {
    const validation = validateTemplate(templateText, variables, true);
    if (!validation.valid) {
      throw new BadRequestException({
        code: 'INVALID_MESSAGE_TEMPLATE',
        message:
          'La plantilla contiene datos automáticos inválidos o sin valor.',
        validation,
      });
    }
    return validation.detectedVariables.reduce(
      (message, key) =>
        message.replace(
          new RegExp(String.raw`\{\{${key}\}\}`, 'g'),
          () => variables[key]!,
        ),
      templateText,
    );
  }

  preview(templateText: string) {
    const values = Object.fromEntries(
      TEMPLATE_VARIABLES.map(({ key, example }) => [key, example]),
    ) as Record<TemplateVariableKey, string>;
    const validation = validateTemplate(templateText, values, true);
    return {
      message: validation.valid
        ? this.render(templateText, values)
        : templateText,
      validation,
      warnings: validation.valid
        ? []
        : ['Corrige la plantilla para generar la vista previa.'],
    };
  }
}
