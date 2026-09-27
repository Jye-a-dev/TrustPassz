/**
 * async-mutex.ts
 * Minimal FIFO asynchronous mutex for serializing blockchain nonce increments.
 */

export class AsyncMutex {
  private _queue: Array<() => void> = [];
  private _locked = false;

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        if (!this._locked) {
          this._locked = true;
          resolve(() => this._release());
        } else {
          this._queue.push(tryAcquire);
        }
      };
      tryAcquire();
    });
  }

  private _release(): void {
    this._locked = false;
    const next = this._queue.shift();
    if (next) next();
  }
}
