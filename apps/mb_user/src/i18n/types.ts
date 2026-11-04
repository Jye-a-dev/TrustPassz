/**
 * TrustPassz Mobile - Type-Safe i18n Contract
 * Defines language codes, schema contract, and dot-notation paths.
 */

export type SupportedLanguage = 'vi' | 'en';

export interface LanguageMeta {
  code: SupportedLanguage;
  label: string;
  subLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  {
    code: 'vi',
    label: 'Tiếng Việt',
    subLabel: 'Mặc định (Vietnam Standard)',
    flag: '🇻🇳',
  },
  {
    code: 'en',
    label: 'English',
    subLabel: 'Fintech Escrow (Global)',
    flag: '🇬🇧',
  },
];

export interface TranslationSchema {
  common: {
    appName: string;
    tagline: string;
    confirm: string;
    cancel: string;
    back: string;
    continue: string;
    save: string;
    close: string;
    retry: string;
    copy: string;
    copied: string;
    loading: string;
    viewDetails: string;
    status: {
      PENDING: string;
      DEPOSITED: string;
      IN_INSPECTION: string;
      SETTLED: string;
      DISPUTED: string;
      CANCELLED: string;
    };
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    connectWallet: string;
    googleSignIn: string;
    devSignIn: string;
    walletPlaceholder: string;
    logout: string;
    logoutConfirm: string;
    sessionExpired: string;
  };
  greeting: {
    welcomeTitle: string;
    welcomeDesc: string;
    startNow: string;
    pillar1Title: string;
    pillar1Subtitle: string;
    pillar1Desc: string;
    pillar2Title: string;
    pillar2Subtitle: string;
    pillar2Desc: string;
    pillar3Title: string;
    pillar3Subtitle: string;
    pillar3Desc: string;
  };
  home: {
    title: string;
    balanceTitle: string;
    lockedBalance: string;
    availableBalance: string;
    disputedBalance: string;
    activeDealsCount: string;
    createDeal: string;
    deposit: string;
    scanQR: string;
    dispute: string;
    recentDeals: string;
    noDeals: string;
    filterAll: string;
    filterActive: string;
    filterCompleted: string;
  };
  deals: {
    dealRoomTitle: string;
    dealIdLabel: string;
    buyer: string;
    seller: string;
    amount: string;
    bargainTitle: string;
    proposedPrice: string;
    originalPrice: string;
    applyBargain: string;
    bargainSuccess: string;
    vietqrTitle: string;
    vietqrInstructions: string;
    waitingPayment: string;
    paymentSuccess: string;
  };
  inspection: {
    title: string;
    countdownLabel: string;
    vaultLockedNotice: string;
    decryptAction: string;
    decrypting: string;
    decryptSuccess: string;
    confirmReceipt: string;
    raiseDisputeAction: string;
  };
  dispute: {
    screenTitle: string;
    dealIdPlaceholder: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    evidenceSection: string;
    extractKeyframesNotice: string;
    dropzoneText: string;
    dropzoneSubtext: string;
    extractingProgress: string;
    submitDispute: string;
    submitting: string;
    successTitle: string;
    successDesc: string;
    backToHome: string;
  };
  settings: {
    title: string;
    languageSection: string;
    languageDesc: string;
    viOption: string;
    viSub: string;
    enOption: string;
    enSub: string;
    themeSection: string;
    themeDark: string;
    networkSection: string;
    networkMainnet: string;
    securitySection: string;
    biometricAuth: string;
    aboutSection: string;
    version: string;
    buildNumber: string;
  };
  errors: {
    networkError: string;
    unauthorized: string;
    dealNotFound: string;
    disputeFailed: string;
    unknown: string;
  };
}

/**
 * Recursive type helper to compute dot-notation keys for nested schema.
 */
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : `${K}`;
    }[keyof T & string]
  : never;

export type TxKeyPath = NestedKeyOf<TranslationSchema>;

export type InterpolationParams = Record<string, string | number>;

