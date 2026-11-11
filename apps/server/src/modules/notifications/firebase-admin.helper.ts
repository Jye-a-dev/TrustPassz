import * as fs from 'node:fs';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  App,
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { Messaging, getMessaging } from 'firebase-admin/messaging';
import {
  MAX_FCM_ATTEMPTS,
  RETRY_BASE_DELAY_MS,
  isTransientFcmError,
  parseServiceAccountJson,
  sleepMs,
} from './firebase-messaging.helper';

function getEnvValue(key: string, configService?: ConfigService): string {
  const cfgVal = configService?.get<string>(key);
  return (cfgVal ?? process.env[key] ?? '').trim();
}

export function initializeFirebaseAdminOnce(
  logger: Logger,
  configService?: ConfigService,
): Messaging | null {
  let app: App | undefined = getApps()[0];

  if (!app) {
    const serviceAccountJson = getEnvValue(
      'FIREBASE_SERVICE_ACCOUNT_JSON',
      configService,
    );
    const parsedAccount = parseServiceAccountJson(serviceAccountJson);

    if (parsedAccount) {
      app = initializeApp({ credential: cert(parsedAccount) });
    } else {
      const projectId = getEnvValue('FIREBASE_PROJECT_ID', configService);
      const clientEmail = getEnvValue('FIREBASE_CLIENT_EMAIL', configService);
      const privateKey = getEnvValue(
        'FIREBASE_PRIVATE_KEY',
        configService,
      ).replace(/\\n/g, '\n');

      if (projectId && clientEmail && privateKey) {
        app = initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
      } else {
        const credPath = getEnvValue(
          'GOOGLE_APPLICATION_CREDENTIALS',
          configService,
        );
        if (credPath && fs.existsSync(credPath)) {
          app = initializeApp({ credential: applicationDefault() });
        }
      }
    }
  }

  if (!app) {
    return null;
  }

  const client = getMessaging(app);
  logger.log('[FCM] Firebase Admin Messaging initialized.');
  return client;
}

export async function initializeMessagingWithRetry(
  logger: Logger,
  configService?: ConfigService,
): Promise<Messaging | null> {
  for (let attempt = 1; attempt <= MAX_FCM_ATTEMPTS; attempt++) {
    try {
      const client = initializeFirebaseAdminOnce(logger, configService);
      if (client) {
        return client;
      }
      logger.error(
        '[FCM] Missing Firebase credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT_JSON).',
      );
      return null;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (attempt < MAX_FCM_ATTEMPTS && isTransientFcmError(error)) {
        logger.warn(
          `[FCM] Transient Firebase init failure (attempt ${attempt}/${MAX_FCM_ATTEMPTS}): ${msg}`,
        );
        await sleepMs(RETRY_BASE_DELAY_MS * attempt);
        continue;
      }
      logger.error(`[FCM] Failed to initialize Firebase Admin SDK: ${msg}`);
      return null;
    }
  }
  return null;
}
