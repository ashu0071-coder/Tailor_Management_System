import { CapacitorConfig } from '@capacitor/cli';


const config: CapacitorConfig = {
  appId: 'com.tailormanagement.app',
  appName: 'Tailor Management',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Uncomment for development with live reload
    // url: 'http://YOUR_IP_ADDRESS:5173',
    // cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#667eea',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#667eea'
    },
    App: {
      // Restore state when app is killed
      zoomEnabled: false
    }
  },
  // iOS specific configuration
  ios: {
    contentInset: 'automatic'
  },
  // Android specific configuration
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  }
};


export default config;



