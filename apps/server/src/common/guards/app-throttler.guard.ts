import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { THROTTLER_LIMIT } from '@nestjs/throttler/dist/throttler.constants';
import type {
  ThrottlerLimitDetail,
  ThrottlerRequest,
} from '@nestjs/throttler/dist/throttler.guard.interface';

/**
 * Enterprise AppThrottlerGuard ensuring strict compliance with HTTP 429
 * standards by:
 *   1. Isolating named throttlers ('auth', 'deals', 'dealsWrite', 'webhook') so they
 *      ONLY enforce limits on endpoints specifically annotated with @Throttle({ [name]: ... }),
 *      preventing false-positive 429 errors on public read APIs (e.g. GET /deals, GET /deals/count).
 *   2. Attaching the standard `Retry-After` header (seconds) on rate limiting.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context, throttler } = requestProps;
    const throttlerName = throttler.name;

    // Route-specific named throttlers only execute if the route/controller explicitly declared them
    if (throttlerName && throttlerName !== 'default') {
      const handler = context.getHandler();
      const classRef = context.getClass();
      const routeOrClassLimit = this.reflector.getAllAndOverride(
        `${THROTTLER_LIMIT}${throttlerName}`,
        [handler, classRef],
      );

      // If this specific throttler is not annotated on this route/controller, do not throttle or deduct tokens
      if (routeOrClassLimit === undefined) {
        return true;
      }
    }

    return super.handleRequest(requestProps);
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const { res } = this.getRequestResponse(context);
    const timeToExpire =
      throttlerLimitDetail.timeToBlockExpire ||
      throttlerLimitDetail.timeToExpire ||
      60000;

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(timeToExpire > 1000 ? timeToExpire / 1000 : timeToExpire),
    );

    this.setResponseHeader(res, 'Retry-After', retryAfterSeconds);
    await super.throwThrottlingException(context, throttlerLimitDetail);
  }
}
