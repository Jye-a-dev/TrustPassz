declare global {
  interface BigInt {
    toJSON(): string;
  }
}

/**
 * Polyfills BigInt.prototype.toJSON type-safely so that JSON.stringify
 * serializes PostgreSQL native BigInt / Prisma BigInt fields as string.
 */
export function setupBigIntSerialization(): void {
  if (!('toJSON' in BigInt.prototype)) {
    Object.defineProperty(BigInt.prototype, 'toJSON', {
      value(this: bigint): string {
        return this.toString();
      },
      configurable: true,
      writable: true,
    });
  }
}

// Automatically invoke on module evaluation
setupBigIntSerialization();
