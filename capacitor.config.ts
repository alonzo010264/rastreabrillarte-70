import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ce55179e1edf4c69b3a8b1f6010efc07',
  appName: 'brillarte',
  webDir: 'dist',
  server: {
    url: 'https://ce55179e-1edf-4c69-b3a8-b1f6010efc07.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ec4899',
      showSpinner: false
    }
  }
};

export default config;
