import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class RequestUser {
  id!: string;
  email!: string | null;
  walletAddress!: string | null;
  role!: string;
}

export type CurrentUserProperty = keyof RequestUser | 'userId';

/**
 * Parameter decorator to extract authenticated user details injected into request context.
 *
 * @example
 * - `@CurrentUser()` user: RequestUser
 * - `@CurrentUser('id')` id: string
 * - `@CurrentUser('userId')` userId: string
 * - `@CurrentUser('walletAddress')` wallet: string | null
 */
export const CurrentUser = createParamDecorator(
  (
    property: CurrentUserProperty | undefined,
    ctx: ExecutionContext,
  ): RequestUser | string | null => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestUser | undefined;

    if (!user) {
      return null;
    }

    if (property === 'userId') {
      return user.id;
    }

    if (property) {
      return user[property as keyof RequestUser];
    }

    return user;
  },
);
