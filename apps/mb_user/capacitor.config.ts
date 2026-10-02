import type { CapacitorConfig } from '@capacitor/cli';

// Hỗ trợ live-reload trực tiếp trên máy ảo Android qua Vite dev server (port 5200)
const isLiveReload = process.env.CAP_LIVE_RELOAD === 'true' || process.env.NODE_ENV !== 'production';

const config: CapacitorConfig = {
  appId: 'io.trustpassz.mobile',
  appName: 'TrustPassz',
  webDir: 'dist',
  server: {
    cleartext: true,
    androidScheme: 'http',
    url: isLiveReload ? 'http://10.0.2.2:5200' : undefined,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
