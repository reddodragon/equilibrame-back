import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{
      user?: Record<string, unknown>;
    }>();

    if (!request.user) {
      return undefined;
    }

    if (!data) {
      return request.user;
    }

    return request.user[data];
  },
);
