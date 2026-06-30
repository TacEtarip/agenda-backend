export const TEMPLATE_VARIABLES = [
  { key: 'name', label: 'Nombre del cliente', description: 'Nombre de la persona que recibirá el mensaje.', example: 'Andrea', contexts: ['all'] },
  { key: 'date', label: 'Fecha de la cita', description: 'Fecha programada de la cita.', example: '15 de julio de 2026, 10:30 a. m.', contexts: ['all'] },
  { key: 'paymentUrl', label: 'Enlace de pago', description: 'Enlace seguro generado para pagar una cita, producto o servicio.', example: 'https://pago.ejemplo.com/abc123', contexts: ['all'] },
] as const;

export type TemplateVariableKey = (typeof TEMPLATE_VARIABLES)[number]['key'];
export interface TemplateValidationResult {
  valid: boolean;
  detectedVariables: TemplateVariableKey[];
  unknownVariables: string[];
  malformedTokens: string[];
  missingVariables: TemplateVariableKey[];
}

const variableKeys = new Set<string>(TEMPLATE_VARIABLES.map(({ key }) => key));
const candidatePattern = /\{\{([^{}]*)\}\}/g;

export function validateTemplate(templateText: string, values: Partial<Record<TemplateVariableKey, string>> = {}, requireValues = false): TemplateValidationResult {
  const detectedVariables = new Set<TemplateVariableKey>();
  const unknownVariables = new Set<string>();
  const malformedTokens = new Set<string>();
  const candidates = [...templateText.matchAll(candidatePattern)];

  for (const match of candidates) {
    const rawKey = match[1];
    if (rawKey !== rawKey.trim()) malformedTokens.add(match[0]);
    else if (!variableKeys.has(rawKey)) unknownVariables.add(rawKey || match[0]);
    else detectedVariables.add(rawKey as TemplateVariableKey);
  }

  const remainder = templateText.replace(candidatePattern, '');
  if (remainder.includes('{{') || remainder.includes('}}')) malformedTokens.add('Llaves incompletas o desbalanceadas');
  const missingVariables = requireValues ? [...detectedVariables].filter((key) => !values[key]?.trim()) : [];
  return {
    valid: unknownVariables.size === 0 && malformedTokens.size === 0 && missingVariables.length === 0,
    detectedVariables: [...detectedVariables], unknownVariables: [...unknownVariables], malformedTokens: [...malformedTokens], missingVariables,
  };
}
