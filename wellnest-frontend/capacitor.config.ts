import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wellnest',
  appName: 'Wellnest',
  webDir: 'build',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#6366f1",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  server: {
    androidScheme: 'https',
    hostname: 'wellnest-eight-psi.vercel.app'
  }
};

export default config;
