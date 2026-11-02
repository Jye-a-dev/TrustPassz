declare module 'react-native' {
  export const Platform: {
    OS: 'android' | 'ios' | 'web';
    Version: number;
    select: <T>(obj: Record<string, T>) => T;
  };

  export const NativeModules: {
    SourceCode?: {
      scriptURL?: string;
    };
    [key: string]: unknown;
  };

  export const PermissionsAndroid: {
    PERMISSIONS: Record<string, string>;
    RESULTS: Record<string, string>;
    request: (permission: string, rationale?: any) => Promise<string>;
    check: (permission: string) => Promise<boolean>;
  };

  export const Vibration: {
    vibrate: (pattern?: number | number[], repeat?: boolean) => void;
    cancel: () => void;
  };

  export interface ViewStyle {
    [key: string]: unknown;
  }

  export interface TextStyle {
    [key: string]: unknown;
  }

  export type StyleProp<T> = T | Array<T | undefined | null | false> | null | undefined;

  export const StyleSheet: {
    create: <T extends Record<string, unknown>>(styles: T) => T;
  };

  export const View: React.ComponentType<any>;
  export const Text: React.ComponentType<any>;
  export const TouchableOpacity: React.ComponentType<any>;
  export const Modal: React.ComponentType<any>;
  export const SafeAreaView: React.ComponentType<any>;
  export const ActivityIndicator: React.ComponentType<any>;
  export const Image: React.ComponentType<any>;
  export const ScrollView: React.ComponentType<any>;
  export const TextInput: React.ComponentType<any>;
  export const Alert: {
    alert: (
      title: string,
      message?: string,
      buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
    ) => void;
  };
  export const Dimensions: {
    get: (dim: 'window' | 'screen') => { width: number; height: number; scale: number; fontScale: number };
  };

  export class Animated {
    static Value: any;
    static timing: any;
    static spring: any;
    static parallel: any;
    static sequence: any;
    static View: any;
  }
}

declare module '@react-native-firebase/messaging' {
  export namespace FirebaseMessagingTypes {
    export interface RemoteMessage {
      messageId?: string;
      notification?: {
        title?: string;
        body?: string;
      };
      data?: Record<string, string>;
      sentTime?: number;
    }
  }

  export enum AuthorizationStatus {
    NOT_DETERMINED = -1,
    DENIED = 0,
    AUTHORIZED = 1,
    PROVISIONAL = 2,
  }

  export interface MessagingInstance {
    requestPermission: (permissions?: any) => Promise<number>;
    hasPermission: (permissions?: any) => Promise<number>;
    getToken: (senderId?: string) => Promise<string>;
    getAPNSToken: () => Promise<string | null>;
    deleteToken: () => Promise<void>;
    onMessage: (listener: (msg: FirebaseMessagingTypes.RemoteMessage) => void) => () => void;
    setBackgroundMessageHandler: (handler: (msg: FirebaseMessagingTypes.RemoteMessage) => Promise<void>) => void;
    onNotificationOpenedApp: (listener: (msg: FirebaseMessagingTypes.RemoteMessage) => void) => () => void;
    getInitialNotification: () => Promise<FirebaseMessagingTypes.RemoteMessage | null>;
    onTokenRefresh: (listener: (token: string) => void) => () => void;
  }

  interface MessagingStatic {
    (): MessagingInstance;
    AuthorizationStatus: typeof AuthorizationStatus;
  }

  const messaging: MessagingStatic;
  export default messaging;
}

declare module '@notifee/react-native' {
  export enum AndroidImportance {
    DEFAULT = 3,
    HIGH = 4,
    MIN = 1,
    LOW = 2,
    NONE = 0,
  }

  export enum AndroidVisibility {
    PRIVATE = 0,
    PUBLIC = 1,
    SECRET = -1,
  }

  export enum AndroidColor {
    EMERALD = '#10B981',
    GREEN = '#22C55E',
  }

  export interface NotificationChannel {
    id: string;
    name: string;
    importance?: AndroidImportance;
    visibility?: AndroidVisibility;
    vibration?: boolean;
    vibrationPattern?: number[];
    sound?: string;
    lights?: boolean;
    lightColor?: string | AndroidColor;
  }

  export interface Notification {
    id?: string;
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
    android?: Record<string, unknown>;
  }

  const notifee: {
    createChannel: (channel: NotificationChannel) => Promise<string>;
    displayNotification: (notification: Notification) => Promise<string>;
    requestPermission: () => Promise<{ authorizationStatus: number }>;
  };

  export default notifee;
}


declare module 'expo-local-authentication' {
  export enum AuthenticationType {
    FINGERPRINT = 1,
    FACIAL_RECOGNITION = 2,
    IRIS = 3,
  }

  export enum SecurityLevel {
    NONE = 0,
    SECRET = 1,
    BIOMETRIC_WEAK = 2,
    BIOMETRIC_STRONG = 3,
  }

  export interface LocalAuthenticationOptions {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
    requireConfirmation?: boolean;
  }

  export type LocalAuthenticationResult =
    | { success: true }
    | { success: false; error: string; warning?: string };

  export function hasHardwareAsync(): Promise<boolean>;
  export function isEnrolledAsync(): Promise<boolean>;
  export function supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
  export function getEnrolledLevelAsync(): Promise<SecurityLevel>;
  export function authenticateAsync(
    options?: LocalAuthenticationOptions
  ): Promise<LocalAuthenticationResult>;
  export function cancelAuthenticate(): Promise<void>;
}

declare module 'expo-secure-store' {
  export enum KeychainAccessibilityConstant {
    WHEN_UNLOCKED = 'WHEN_UNLOCKED',
    AFTER_FIRST_UNLOCK = 'AFTER_FIRST_UNLOCK',
    ALWAYS = 'ALWAYS',
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY = 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY',
    WHEN_UNLOCKED_THIS_DEVICE_ONLY = 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
    ALWAYS_THIS_DEVICE_ONLY = 'ALWAYS_THIS_DEVICE_ONLY',
  }

  export interface SecureStoreOptions {
    keychainService?: string;
    keychainAccessible?: KeychainAccessibilityConstant;
    requireAuthentication?: boolean;
    authenticationPrompt?: string;
  }

  export function setItemAsync(
    key: string,
    value: string,
    options?: SecureStoreOptions
  ): Promise<void>;
  export function getItemAsync(
    key: string,
    options?: SecureStoreOptions
  ): Promise<string | null>;
  export function deleteItemAsync(
    key: string,
    options?: SecureStoreOptions
  ): Promise<void>;
  export function isAvailableAsync(): Promise<boolean>;
}
