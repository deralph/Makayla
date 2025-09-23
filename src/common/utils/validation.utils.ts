import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

export async function validateDto(dto: any, dtoClass: any): Promise<string[]> {
  const obj = plainToClass(dtoClass, dto);
  const errors: ValidationError[] = await validate(obj);

  if (errors.length > 0) {
    const errorMessages: string[] = [];
    errors.forEach((error) => {
      if (error.constraints) {
        Object.values(error.constraints).forEach((message) => {
          errorMessages.push(message);
        });
      }
    });
    return errorMessages;
  }

  return [];
}

export function sanitizeInput(input: string): string {
  // Basic sanitization to prevent XSS
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
