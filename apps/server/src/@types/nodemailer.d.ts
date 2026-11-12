declare module 'nodemailer' {
  export interface Address {
    name: string;
    address: string;
  }

  export interface AttachmentLike {
    filename?: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }

  export interface SendMailOptions {
    from?: string | Address;
    to?: string | Address | Array<string | Address>;
    cc?: string | Address | Array<string | Address>;
    bcc?: string | Address | Array<string | Address>;
    subject?: string;
    text?: string;
    html?: string;
    attachments?: AttachmentLike[];
    headers?: Record<string, string>;
  }

  export interface SentMessageInfo {
    messageId: string;
    envelope: Record<string, unknown>;
    accepted: string[];
    rejected: string[];
    pending: string[];
    response: string;
  }

  export interface PoolOptions {
    pool?: boolean;
    maxConnections?: number;
    maxMessages?: number;
    rateDelta?: number;
    rateLimit?: number;
  }

  export interface SmtpOptions extends PoolOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
      type?: string;
    };
    tls?: {
      rejectUnauthorized?: boolean;
      ciphers?: string;
    };
    connectionTimeout?: number;
    greetingTimeout?: number;
    socketTimeout?: number;
  }

  export interface Transporter {
    sendMail(mailOptions: SendMailOptions): Promise<SentMessageInfo>;
    verify(): Promise<boolean>;
    close(): void;
  }

  export function createTransport(
    options: SmtpOptions | Record<string, unknown>,
    defaults?: SendMailOptions,
  ): Transporter;
}

