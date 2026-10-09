import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ThrottlerLimitDetail } from '@nestjs/throttler/dist/throttler.guard.interface';

/**
 * Enterprise AppThrottlerGuard ensuring strict compliance with HTTP 429
 * standards by attaching standard `Retry-After` header (seconds) on rate limiting.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
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

