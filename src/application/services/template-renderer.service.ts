import { Injectable } from '@nestjs/common';

export interface TemplateVariables {
  name?: string;
  paymentUrl?: string;
  date?: string;
  [key: string]: string | undefined;
}

@Injectable()
export class TemplateRendererService {
  /**
   * Reemplaza las variables como {{name}}, {{paymentUrl}}, etc.
   * en el texto de la plantilla.
   */
  render(templateText: string, variables: TemplateVariables): string {
    let message = templateText;

    if (variables.name) {
      message = message.replace(/\{\{name\}\}/gi, variables.name);
    }

    if (variables.paymentUrl) {
      message = message.replace(/\{\{paymentUrl\}\}/gi, variables.paymentUrl);
    }

    if (variables.date) {
      message = message.replace(/\{\{date\}\}/gi, variables.date);
    }

    // Podríamos extender para buscar Object.keys(variables) y hacer replace de todos,
    // pero para MVP esto es rápido y seguro.

    return message;
  }
}
