/**
 * TrustPassz Mobile - Notification Service
 * Manages FCM initialization, OS permission requests, device tokens, and channels.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidColor,
} from '@notifee/react-native';
import {
  DeviceTokenPayload,
  EscrowNotificationData,
  NotificationNavigationRoute,
  EscrowActionType,
  EscrowEventType,
} from '../types/notification.types';

export const ESCROW_NOTIFICATION_CHANNEL_ID = 'trustpassz_escrow_alerts';
export const ESCROW_NOTIFICATION_CHANNEL_NAME = 'TrustPassz Escrow Alerts';
export const ESCROW_ACCENT_COLOR = '#10B981';

export class NotificationService {
  private static instance: NotificationService | null = null;
  private apiBaseUrl: string;

  private constructor() {
    this.apiBaseUrl =
      process.env.EXPO_PUBLIC_API_URL ||
      (Platform.OS === 'android'
        ? 'http://10.0.2.2:3000'
        : 'http://localhost:3000');
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initializes Android High-Importance Escrow Notification Channel
   */
  public async initializeChannel(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      await notifee.createChannel({
        id: ESCROW_NOTIFICATION_CHANNEL_ID,
        name: ESCROW_NOTIFICATION_CHANNEL_NAME,
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        vibration: true,
        vibrationPattern: [300, 500, 300, 500],
        lights: true,
        lightColor: AndroidColor.GREEN,
        sound: 'default',
      });
    } catch (error) {
      const err = error as Error;
      console.error('[NotificationService] Channel creation failure:', err.message);
    }
  }

  /**
   * Requests OS notification permissions (iOS APNs & Android 13+ POST_NOTIFICATIONS)
   */
  public async requestUserPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission({
          alert: true,
          badge: true,
          sound: true,
          provisional: false,
        });

        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        return enabled;
      }

      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'TrustPassz Escrow Alerts',
            message:
              'TrustPassz requires notification access to notify you of deposits, vault unlocks, and deal proposals.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );

        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }

      return true;
    } catch (error) {
      const err = error as Error;
      console.error('[NotificationService] Permission request failed:', err.message);
      return false;
    }
  }

  /**
   * Retrieves active FCM Device Token
   */
  public async getDeviceToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'ios') {
        const apnsToken = await messaging().getAPNSToken();
        if (!apnsToken) {
          console.warn('[NotificationService] Waiting for APNs device registration...');
        }
      }

      const fcmToken = await messaging().getToken();
      return fcmToken;
    } catch (error) {
      const err = error as Error;
      console.error('[NotificationService] Error acquiring FCM token:', err.message);
      return null;
    }
  }

  /**
   * Synchronizes device token with apps/server backend
   */
  public async syncTokenWithBackend(
    token: string,
    userId: string
  ): Promise<boolean> {
    try {
      const payload: DeviceTokenPayload = {
        token,
        userId,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        deviceModel: `${Platform.OS}-${Platform.Version}`,
        appVersion: '1.0.0',
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(
        `${this.apiBaseUrl}/api/v1/notifications/device-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with HTTP status ${response.status}`);
      }

      return true;
    } catch (error) {
      const err = error as Error;
      console.error('[NotificationService] Failed to sync token with server:', err.message);
      return false;
    }
  }

  /**
   * Unregisters device token upon user logout
   */
  public async unregisterToken(userId: string): Promise<boolean> {
    try {
      const currentToken = await this.getDeviceToken();
      if (!currentToken) {
        return true;
      }

      const response = await fetch(
        `${this.apiBaseUrl}/api/v1/notifications/device-token`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, token: currentToken }),
        }
      );

      await messaging().deleteToken();
      return response.ok;
    } catch (error) {
      const err = error as Error;
      console.error('[NotificationService] Failed to unregister device token:', err.message);
      return false;
    }
  }

  /**
   * Listens for token refreshes and synchronizes changes
   */
  public listenTokenRefresh(
    userId: string,
    onRefreshed?: (newToken: string) => void
  ): () => void {
    return messaging().onTokenRefresh(async (refreshedToken: string) => {
      await this.syncTokenWithBackend(refreshedToken, userId);
      if (onRefreshed) {
        onRefreshed(refreshedToken);
      }
    });
  }

  /**
   * Parses RemoteMessage into strongly typed EscrowNotificationData
   */
  public parsePayload(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): EscrowNotificationData {
    const rawData = remoteMessage.data || {};

    const type = (rawData.type as EscrowEventType) || 'NEW_DEAL';
    const dealId = String(rawData.dealId || '');
    const route = (rawData.route as NotificationNavigationRoute) || '/deal-room';
    const action = (rawData.action as EscrowActionType) || 'VIEW_DEAL';

    return {
      ...rawData,
      type,
      dealId,
      dealTitle: rawData.dealTitle ? String(rawData.dealTitle) : undefined,
      price: rawData.price ? String(rawData.price) : undefined,
      proposedBy: rawData.proposedBy ? String(rawData.proposedBy) : undefined,
      amount: rawData.amount ? String(rawData.amount) : undefined,
      txHash: rawData.txHash ? String(rawData.txHash) : undefined,
      status: rawData.status ? String(rawData.status) : undefined,
      vaultId: rawData.vaultId ? String(rawData.vaultId) : undefined,
      inspectionDeadline: rawData.inspectionDeadline
        ? String(rawData.inspectionDeadline)
        : undefined,
      route,
      action,
    };
  }

  /**
   * Registers global background message handler (Headless JS / Background execution)
   */
  public registerBackgroundMessageHandler(): void {
    messaging().setBackgroundMessageHandler(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const payload = this.parsePayload(remoteMessage);
        console.log(
          '[NotificationService] Processed Headless Background FCM Message:',
          payload.type,
          payload.dealId
        );
      }
    );
  }
}

export const notificationService = NotificationService.getInstance();

