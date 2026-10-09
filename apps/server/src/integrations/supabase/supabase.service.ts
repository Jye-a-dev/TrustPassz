import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

// Ensure global WebSocket is available for Supabase Realtime across all Node versions
if (typeof globalThis.WebSocket === 'undefined') {
  // @ts-expect-error Node WebSocket polyfill
  globalThis.WebSocket = WebSocket;
}

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client!: ReturnType<typeof createClient>;
  private storageBucket!: string;

  onModuleInit() {
    const supabaseUrl =
      process.env.SUPABASE_URL || 'https://eixscrzogbnjrwfbcqst.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    this.storageBucket =
      process.env.SUPABASE_STORAGE_BUCKET || 'dispute-evidences';

    if (!supabaseServiceKey) {
      this.logger.warn(
        'SUPABASE_SERVICE_ROLE_KEY is not defined. BaaS features will be restricted.',
      );
    }

    this.client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    this.logger.log(`Supabase Client initialized against ${supabaseUrl}`);
  }

  getClient(): ReturnType<typeof createClient> {
    return this.client;
  }

  /**
   * Uploads dispute proof file to Supabase Object Storage and returns the public CDN URL.
   */
  async uploadDisputeEvidence(
    dealId: string,
    file: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<string> {
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `evidence/${dealId}/${Date.now()}_${sanitizedFilename}`;

    const { error: uploadError } = await this.client.storage
      .from(this.storageBucket)
      .upload(storagePath, file, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      this.logger.error(
        `Storage upload failed for deal ${dealId}: ${uploadError.message}`,
        uploadError,
      );
      throw new Error(
        `Failed to upload dispute evidence: ${uploadError.message}`,
      );
    }

    const { data } = this.client.storage
      .from(this.storageBucket)
      .getPublicUrl(storagePath);

    if (!data?.publicUrl) {
      throw new Error('Failed to resolve public CDN URL for uploaded asset.');
    }

    this.logger.log(`Dispute evidence persisted: ${data.publicUrl}`);
    return data.publicUrl;
  }

  /**
   * Broadcasts realtime bargain slider updates to connected buyer/seller peers.
   */
  async broadcastBargainPrice(
    dealId: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const channelName = `deal-room:${dealId}`;
    const channel = this.client.channel(channelName);

    const event = 'bargain:slider_update';
    const messagePayload = {
      dealId,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    if (typeof (channel as any).httpSend === 'function') {
      await (channel as any).httpSend(event, messagePayload);
    } else {
      await channel.send({
        type: 'broadcast',
        event,
        payload: messagePayload,
      });
    }

    this.logger.debug(`Realtime bargain update broadcasted to ${channelName}`);
  }

  /**
   * Broadcasts realtime payment confirmation to connected deal room peers.
   */
  async broadcastPaymentSuccess(
    dealId: string,
    state: string = 'DEPOSITED',
  ): Promise<void> {
    try {
      const channelName = `deal-room:${dealId}`;
      const channel = this.client.channel(channelName);

      const timestamp = new Date().toISOString();

      if (typeof (channel as any).httpSend === 'function') {
        await (channel as any).httpSend('PAYMENT_RECEIVED', {
          dealId,
          state,
          timestamp,
        });
      } else {
        await channel.send({
          type: 'broadcast',
          event: 'PAYMENT_RECEIVED',
          payload: {
            dealId,
            state,
            timestamp,
          },
        });
      }

      if (typeof (channel as any).httpSend === 'function') {
        await (channel as any).httpSend('DEPOSIT_CONFIRMED', {
          dealId,
          state,
          timestamp,
        });
      } else {
        await channel.send({
          type: 'broadcast',
          event: 'DEPOSIT_CONFIRMED',
          payload: {
            dealId,
            state,
            timestamp,
          },
        });
      }

      this.logger.debug(`Realtime payment broadcast sent to ${channelName}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Failed to broadcast payment success on Supabase: ${msg}`,
      );
    }
  }
}
