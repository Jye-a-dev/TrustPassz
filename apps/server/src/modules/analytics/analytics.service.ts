import { Injectable, Logger } from '@nestjs/common';
import { DealState, ArbitrationVerdict, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AnalyticsCacheService } from './analytics-cache.service';
import {
  AnalyticsOverviewResponse,
  ConfidenceTierBreakdown,
  DealDistributionItem,
  DisputeAiMetrics,
  KpiOverview,
  TvlDataPoint,
  TvlTimeframe,
} from './interfaces/analytics.interface';

interface RawTvlRow {
  date_str: string;
  currency: string;
  locked_tvl: string | number;
  cumulative_volume: string | number;
  deal_count: number | string;
}

const STATE_CONFIG: Record<
  DealState,
  { label: string; color: string }
> = {
  [DealState.PENDING]: { label: 'Chờ thanh toán', color: '#64748B' },
  [DealState.DEPOSITED]: { label: 'Đã ký quỹ', color: '#06B6D4' },
  [DealState.IN_INSPECTION]: { label: 'Đang thẩm định', color: '#F59E0B' },
  [DealState.SETTLED]: { label: 'Đã giải ngân', color: '#10B981' },
  [DealState.REFUNDED]: { label: 'Đã hoàn tiền', color: '#8B5CF6' },
  [DealState.DISPUTED]: { label: 'Đang tranh chấp', color: '#EF4444' },
};

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: AnalyticsCacheService,
  ) {}

  /**
   * Timeseries aggregation for TVL and Escrow Cumulative Volume
   */
  async getTvlTimeseries(
    timeframe: TvlTimeframe = '30d',
  ): Promise<TvlDataPoint[]> {
    const days = timeframe === '7d' ? 7 : timeframe === '90d' ? 90 : timeframe === 'all' ? 365 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const rawRows = await this.prisma.$queryRaw<RawTvlRow[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS date_str,
        UPPER(currency) AS currency,
        COALESCE(SUM(CASE WHEN state IN ('DEPOSITED', 'IN_INSPECTION') THEN amount ELSE 0 END), 0)::text AS locked_tvl,
        COALESCE(SUM(CASE WHEN state IN ('DEPOSITED', 'IN_INSPECTION', 'SETTLED') THEN amount ELSE 0 END), 0)::text AS cumulative_volume,
        COUNT(*)::int AS deal_count
      FROM deals
      WHERE created_at >= ${startDate}
      GROUP BY DATE_TRUNC('day', created_at), currency
      ORDER BY DATE_TRUNC('day', created_at) ASC;
    `;

    // Build continuous date map to prevent charting gaps
    const dateMap = new Map<string, TvlDataPoint>();
    const currentDate = new Date(startDate);
    const now = new Date();

    while (currentDate <= now) {
      const dateKey = currentDate.toISOString().slice(0, 10);
      dateMap.set(dateKey, {
        date: dateKey,
        vndLocked: 0,
        vndVolume: 0,
        ethLocked: 0,
        ethVolume: 0,
        dealCount: 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    for (const row of rawRows) {
      const entry = dateMap.get(row.date_str) ?? {
        date: row.date_str,
        vndLocked: 0,
        vndVolume: 0,
        ethLocked: 0,
        ethVolume: 0,
        dealCount: 0,
      };

      const lockedVal = Number(row.locked_tvl) || 0;
      const volumeVal = Number(row.cumulative_volume) || 0;
      const countVal = Number(row.deal_count) || 0;

      if (row.currency === 'VND') {
        entry.vndLocked += lockedVal;
        entry.vndVolume += volumeVal;
      } else {
        entry.ethLocked += lockedVal;
        entry.ethVolume += volumeVal;
      }
      entry.dealCount += countVal;
      dateMap.set(row.date_str, entry);
    }

    return Array.from(dateMap.values());
  }

  /**
   * Distribution of all 6 Deal states with counts, percentages and totals
   */
  async getDealDistribution(): Promise<DealDistributionItem[]> {
    const [aggregates, totalDeals] = await Promise.all([
      this.prisma.deal.groupBy({
        by: ['state'],
        _count: { id: true },
        _sum: { amount: true },
      }),
      this.prisma.deal.count(),
    ]);

    const aggregateMap = new Map<
      DealState,
      { count: number; totalAmount: number }
    >();

    for (const item of aggregates) {
      aggregateMap.set(item.state, {
        count: item._count.id,
        totalAmount: Number(item._sum.amount ?? 0),
      });
    }

    const allStates: DealState[] = [
      DealState.PENDING,
      DealState.DEPOSITED,
      DealState.IN_INSPECTION,
      DealState.SETTLED,
      DealState.REFUNDED,
      DealState.DISPUTED,
    ];

    return allStates.map((state) => {
      const stats = aggregateMap.get(state) ?? { count: 0, totalAmount: 0 };
      const percentage =
        totalDeals > 0
          ? Number(((stats.count / totalDeals) * 100).toFixed(1))
          : 0;

      return {
        state,
        label: STATE_CONFIG[state].label,
        count: stats.count,
        percentage,
        totalAmountVnd: stats.totalAmount,
        color: STATE_CONFIG[state].color,
      };
    });
  }

  /**
   * AI Dispute arbitration analytics & override metrics
   */
  async getDisputeAiMetrics(): Promise<DisputeAiMetrics> {
    const [totalDisputes, resolvedDisputes, allDisputes] = await Promise.all([
      this.prisma.disputeLog.count(),
      this.prisma.disputeLog.count({
        where: { status: { in: ['AI_RESOLVED', 'CLOSED'] } },
      }),
      this.prisma.disputeLog.findMany({
        select: {
          aiVerdict: true,
          aiConfidenceScore: true,
          adminVerdict: true,
        },
      }),
    ]);

    let approvePayout = 0;
    let triggerRefund = 0;
    let escalateToAdmin = 0;
    let adminOverrideCount = 0;
    let confidenceSum = 0;
    let confidenceCount = 0;

    let lowConfCount = 0;
    let medConfCount = 0;
    let highConfCount = 0;

    for (const d of allDisputes) {
      if (d.aiVerdict === ArbitrationVerdict.APPROVE_PAYOUT) approvePayout++;
      else if (d.aiVerdict === ArbitrationVerdict.TRIGGER_REFUND) triggerRefund++;
      else if (d.aiVerdict === ArbitrationVerdict.ESCALATE_TO_ADMIN) escalateToAdmin++;

      if (d.aiConfidenceScore !== null && d.aiConfidenceScore !== undefined) {
        const score = Number(d.aiConfidenceScore);
        confidenceSum += score;
        confidenceCount++;

        if (score < 0.6) {
          lowConfCount++;
        } else if (score < 0.75) {
          medConfCount++;
        } else {
          highConfCount++;
        }
      }

      if (d.adminVerdict && d.aiVerdict && d.adminVerdict !== d.aiVerdict) {
        adminOverrideCount++;
      }
    }

    const avgConfidenceScore =
      confidenceCount > 0
        ? Number((confidenceSum / confidenceCount).toFixed(4))
        : 0;

    const resolutionRatePct =
      totalDisputes > 0
        ? Number(((resolvedDisputes / totalDisputes) * 100).toFixed(1))
        : 100;

    const disputesWithVerdict = approvePayout + triggerRefund + escalateToAdmin;
    const adminOverrideRatePct =
      disputesWithVerdict > 0
        ? Number(((adminOverrideCount / disputesWithVerdict) * 100).toFixed(1))
        : 0;

    const autonomousResolvedCount = highConfCount - adminOverrideCount;
    const autonomousResolutionRatePct =
      totalDisputes > 0
        ? Number(
            Math.max(
              0,
              ((autonomousResolvedCount / totalDisputes) * 100),
            ).toFixed(1),
          )
        : 100;

    const calcTierPct = (count: number) =>
      confidenceCount > 0
        ? Number(((count / confidenceCount) * 100).toFixed(1))
        : 0;

    const confidenceTiers: ConfidenceTierBreakdown = {
      low: { count: lowConfCount, percentage: calcTierPct(lowConfCount) },
      medium: { count: medConfCount, percentage: calcTierPct(medConfCount) },
      high: { count: highConfCount, percentage: calcTierPct(highConfCount) },
    };

    return {
      totalDisputes,
      resolvedDisputes,
      resolutionRatePct,
      verdictDistribution: {
        approvePayout,
        triggerRefund,
        escalateToAdmin,
      },
      avgConfidenceScore,
      confidenceTiers,
      adminOverrideCount,
      adminOverrideRatePct,
      autonomousResolutionRatePct,
    };
  }

  /**
   * Top-level KPI aggregations
   */
  async getKpiOverview(disputeMetrics: DisputeAiMetrics): Promise<KpiOverview> {
    const [totalDeals, activeEscrowDeals, disputedDeals, tvlAggregates] =
      await Promise.all([
        this.prisma.deal.count(),
        this.prisma.deal.count({
          where: { state: { in: [DealState.DEPOSITED, DealState.IN_INSPECTION] } },
        }),
        this.prisma.deal.count({
          where: { state: DealState.DISPUTED },
        }),
        this.prisma.deal.groupBy({
          by: ['currency', 'state'],
          _sum: { amount: true },
        }),
      ]);

    let lockedTvlVnd = 0;
    let lockedTvlEth = 0;
    let totalVolumeVnd = 0;
    let totalVolumeEth = 0;

    for (const group of tvlAggregates) {
      const amount = Number(group._sum.amount ?? 0);
      const isVnd = group.currency.toUpperCase() === 'VND';
      const isLocked =
        group.state === DealState.DEPOSITED ||
        group.state === DealState.IN_INSPECTION;
      const isCumulative = isLocked || group.state === DealState.SETTLED;

      if (isVnd) {
        if (isLocked) lockedTvlVnd += amount;
        if (isCumulative) totalVolumeVnd += amount;
      } else {
        if (isLocked) lockedTvlEth += amount;
        if (isCumulative) totalVolumeEth += amount;
      }
    }

    const disputeRatePct =
      totalDeals > 0
        ? Number(((disputedDeals / totalDeals) * 100).toFixed(1))
        : 0;

    return {
      lockedTvlVnd,
      lockedTvlEth,
      totalVolumeVnd,
      totalVolumeEth,
      totalDeals,
      activeEscrowDeals,
      disputeRatePct,
      autonomousResolutionRatePct: disputeMetrics.autonomousResolutionRatePct,
    };
  }

  /**
   * Comprehensive cached dashboard analytics payload
   */
  async getOverview(
    timeframe: TvlTimeframe = '30d',
  ): Promise<AnalyticsOverviewResponse> {
    const cacheKey = `analytics:overview:${timeframe}`;

    const { data, metadata } = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const [tvlTimeseries, dealDistribution, disputeMetrics] =
          await Promise.all([
            this.getTvlTimeseries(timeframe),
            this.getDealDistribution(),
            this.getDisputeAiMetrics(),
          ]);

        const kpis = await this.getKpiOverview(disputeMetrics);

        return {
          kpis,
          tvlTimeseries,
          dealDistribution,
          disputeMetrics,
        };
      },
      60 * 1000, // 60s in-memory TTL
    );

    return {
      ...data,
      cacheMetadata: metadata,
    };
  }

  /**
   * Proactive cache invalidation (triggered by settlement/dispute webhooks)
   */
  invalidateCache(): void {
    this.cacheService.invalidate('analytics:');
  }
}

