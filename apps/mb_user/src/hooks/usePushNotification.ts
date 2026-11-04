/**
 * TrustPassz Mobile - usePushNotification Hook
 * Handles push notification lifecycle: foreground banners, background clicks,
 * deep link routing, and token synchronization.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Vibration, Platform } from 'react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import {
  DeepLinkParams,
  InAppNotification,
  EscrowNotificationData,
} from '../types/notification.types';
import { notificationService } from '../services/notification.service';

interface UsePushNotificationOptions {
  userId?: string;
  onNavigate?: (params: DeepLinkParams) => void;
}

interface UsePushNotificationReturn {
  fcmToken: string | null;
  permissionGranted: boolean;
  currentNotification: InAppNotification | null;
  dismissBanner: () => void;
  handleBannerPress: () => void;
}

export function usePushNotification({
  userId,
  onNavigate,
}: UsePushNotificationOptions = {}): UsePushNotificationReturn {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [currentNotification, setCurrentNotification] =
    useState<InAppNotification | null>(null);

  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const dismissBanner = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    setCurrentNotification(null);
  }, []);

  const triggerHapticAndAudioFeedback = useCallback(() => {
    try {
      if (Platform.OS === 'android') {
        Vibration.vibrate([0, 40, 60, 40]);
      } else {
        Vibration.vibrate();
      }
    } catch (err) {
      const error = err as Error;
      console.warn('[usePushNotification] Feedback trigger non-fatal error:', error.message);
    }
  }, []);

  const routeNotification = useCallback(
    (data: EscrowNotificationData) => {
      if (!onNavigate) return;

      const params: DeepLinkParams = {
        route: data.route,
        dealId: data.dealId,
        vaultId: data.vaultId,
        action: data.action,
      };

      onNavigate(params);
    },
    [onNavigate]
  );

  const handleBannerPress = useCallback(() => {
    if (currentNotification) {
      const data = currentNotification.data;
      dismissBanner();
      routeNotification(data);
    }
  }, [currentNotification, dismissBanner, routeNotification]);

  // 1. Initial Permission Request & Token Setup
  useEffect(() => {
    let isMounted = true;

    async function initPush() {
      await notificationService.initializeChannel();
      const granted = await notificationService.requestUserPermission();
      if (!isMounted) return;
      setPermissionGranted(granted);

      if (granted) {
        const token = await notificationService.getDeviceToken();
        if (isMounted && token) {
          setFcmToken(token);
          if (userId) {
            await notificationService.syncTokenWithBackend(token, userId);
          }
        }
      }
    }

    initPush();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // 2. Token Refresh Listener
  useEffect(() => {
    if (!userId) return;

    const unsubscribeRefresh = notificationService.listenTokenRefresh(
      userId,
      (newToken: string) => {
        setFcmToken(newToken);
      }
    );

    return () => {
      unsubscribeRefresh();
    };
  }, [userId]);

  // 3. Foreground Message Listener
  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const data = notificationService.parsePayload(remoteMessage);
        const title =
          remoteMessage.notification?.title ||
          (data.type === 'NEW_DEAL' ? 'Hợp đồng Escrow mới' : 'Cập nhật giao dịch');
        const body =
          remoteMessage.notification?.body ||
          data.dealTitle ||
          'Bạn có thông báo bảo chứng mới từ TrustPassz';

        triggerHapticAndAudioFeedback();

        const bannerNotification: InAppNotification = {
          id: remoteMessage.messageId || `${Date.now()}`,
          title,
          body,
          data,
          receivedAt: Date.now(),
        };

        setCurrentNotification(bannerNotification);

        if (autoDismissTimerRef.current) {
          clearTimeout(autoDismissTimerRef.current);
        }
        autoDismissTimerRef.current = setTimeout(() => {
          setCurrentNotification(null);
        }, 4500);
      }
    );

    return () => {
      unsubscribeForeground();
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [triggerHapticAndAudioFeedback]);

  // 4. Background & Quit State Notification Clicks
  useEffect(() => {
    // Handling Background State click
    const unsubscribeOpenedApp = messaging().onNotificationOpenedApp(
      (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        const data = notificationService.parsePayload(remoteMessage);
        routeNotification(data);
      }
    );

    // Handling Quit State click
    messaging()
      .getInitialNotification()
      .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
        if (remoteMessage) {
          const data = notificationService.parsePayload(remoteMessage);
          routeNotification(data);
        }
      });

    return () => {
      unsubscribeOpenedApp();
    };
  }, [routeNotification]);

  return {
    fcmToken,
    permissionGranted,
    currentNotification,
    dismissBanner,
    handleBannerPress,
  };
}

