import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { validateDto } from '../utils/validation.utils';

@Injectable()
export class ValidationInterceptor implements NestInterceptor {
  constructor(private readonly dtoClass: any) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const errors = await validateDto(request.body, this.dtoClass);

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    return next.handle();
  }
}
