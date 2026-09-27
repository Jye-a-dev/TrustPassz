import * as crypto from 'crypto';

export function generatePaymentSignature(
  data: Record<string, any>,
  key: string,
): string {
  const sortedKeys = Object.keys(data).sort();
  const queryParts: string[] = [];
  for (const k of sortedKeys) {
    const val = data[k];
    if (val !== undefined && val !== null) {
      queryParts.push(`${k}=${val}`);
    }
  }
  return crypto
    .createHmac('sha256', key)
    .update(queryParts.join('&'))
    .digest('hex');
}

export function createPaymentsWebhookPrismaMock(
  getDeals: () => any[],
  getOrders: () => any[],
) {
  const mockPrismaService: any = {
    deal: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const found = getDeals().find((d) => d.id === where.id);
        if (!found) return Promise.resolve(null);
        const order = getOrders().find((o) => o.dealId === found.id) || null;
        return Promise.resolve({ ...found, order });
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const deals = getDeals();
        if (where.webhookIdempotencyKey !== undefined) {
          const match = deals.find(
            (d) => d.webhookIdempotencyKey === where.webhookIdempotencyKey,
          );
          return Promise.resolve(match || null);
        }
        if (where.OR) {
          for (const condition of where.OR) {
            if (condition.webhookIdempotencyKey) {
              const match = deals.find(
                (d) =>
                  d.webhookIdempotencyKey === condition.webhookIdempotencyKey,
              );
              if (match) return Promise.resolve(match);
            }
            if (condition.paymentOrderCode) {
              const match = deals.find(
                (d) =>
                  d.paymentOrderCode === condition.paymentOrderCode &&
                  condition.state?.in?.includes(d.state),
              );
              if (match) return Promise.resolve(match);
            }
          }
          return Promise.resolve(null);
        }
        if (where.paymentOrderCode !== undefined) {
          const match = deals.find(
            (d) => d.paymentOrderCode === where.paymentOrderCode,
          );
          if (!match) return Promise.resolve(null);
          const order = getOrders().find((o) => o.dealId === match.id) || null;
          return Promise.resolve({ ...match, order });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const deals = getDeals();
        const index = deals.findIndex((d) => d.id === where.id);
        if (index === -1) return Promise.resolve(null);
        deals[index] = { ...deals[index], ...data };
        return Promise.resolve(deals[index]);
      }),
    },
    order: {
      update: jest.fn().mockImplementation(({ where, data }) => {
        const orders = getOrders();
        const index = orders.findIndex((o) => o.id === where.id);
        if (index === -1) return Promise.resolve(null);
        orders[index] = { ...orders[index], ...data };
        return Promise.resolve(orders[index]);
      }),
    },
    $transaction: jest.fn().mockImplementation((cb) => cb(mockPrismaService)),
  };

  return mockPrismaService;
}
