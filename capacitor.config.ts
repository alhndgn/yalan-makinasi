import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.teqstudio.yalan',
  appName: 'Yalan Makinası',
  webDir: 'src/web/dist',
  bundledWebRuntime: false,
  plugins: {
    CapacitorHttp: { enabled: true },
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
