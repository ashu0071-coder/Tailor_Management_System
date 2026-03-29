/**
 * Mobile App Initialization
 *
 * This file contains mobile-specific initialization code for Capacitor.
 * Import this in main.jsx when building for mobile platforms.
 */


import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';


/**
 * Check if app is running on native platform
 */
export const isNativePlatform = () => {
  return Capacitor.isNativePlatform();
};


/**
 * Get current platform (ios, android, web)
 */
export const getPlatform = () => {
  return Capacitor.getPlatform();
};


/**
 * Initialize status bar for mobile
 */
export const initializeStatusBar = async () => {
  if (!isNativePlatform()) return;


  try {
    // Set status bar style
    await StatusBar.setStyle({ style: Style.Light });
   
    // Set background color for Android
    if (getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#667eea' });
    }
   
    // Show status bar
    await StatusBar.show();
   
    console.log('Status bar initialized');
  } catch (error) {
    console.error('Status bar initialization failed:', error);
  }
};


/**
 * Initialize splash screen
 */
export const initializeSplashScreen = async () => {
  if (!isNativePlatform()) return;


  try {
    // Hide splash screen after app is loaded
    await SplashScreen.hide();
    console.log('Splash screen hidden');
  } catch (error) {
    console.error('Splash screen error:', error);
  }
};


/**
 * Handle Android back button
 */
export const initializeBackButton = () => {
  if (getPlatform() !== 'android') return;


  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (!canGoBack) {
      // If we can't go back, exit the app
      CapApp.exitApp();
    } else {
      // Otherwise, go back in history
      window.history.back();
    }
  });


  console.log('Back button handler registered');
};


/**
 * Handle app state changes
 */
export const initializeAppStateListeners = () => {
  if (!isNativePlatform()) return;


  // App becomes active
  CapApp.addListener('appStateChange', ({ isActive }) => {
    console.log('App state changed. Active:', isActive);
   
    if (isActive) {
      // App came to foreground
      // You can refresh data here
      console.log('App is now active');
    } else {
      // App went to background
      console.log('App is now in background');
    }
  });


  // Handle URL open (deep linking)
  CapApp.addListener('appUrlOpen', data => {
    console.log('App opened with URL:', data.url);
    // Handle deep link navigation here
  });


  console.log('App state listeners registered');
};


/**
 * Initialize all mobile features
 */
export const initializeMobileApp = async () => {
  if (!isNativePlatform()) {
    console.log('Running on web platform, skipping mobile initialization');
    return;
  }


  console.log(`Initializing mobile app on ${getPlatform()}`);


  try {
    // Initialize status bar
    await initializeStatusBar();


    // Initialize back button (Android only)
    initializeBackButton();


    // Initialize app state listeners
    initializeAppStateListeners();


    // Hide splash screen
    // Wait a bit for the app to fully render
    setTimeout(async () => {
      await initializeSplashScreen();
    }, 1000);


    console.log('Mobile app initialized successfully');
  } catch (error) {
    console.error('Mobile app initialization error:', error);
  }
};


/**
 * Show loading indicator
 */
export const showLoading = async () => {
  if (!isNativePlatform()) return;


  try {
    await SplashScreen.show({
      showDuration: 0,
      autoHide: false
    });
  } catch (error) {
    console.error('Error showing loading:', error);
  }
};


/**
 * Hide loading indicator
 */
export const hideLoading = async () => {
  if (!isNativePlatform()) return;


  try {
    await SplashScreen.hide();
  } catch (error) {
    console.error('Error hiding loading:', error);
  }
};


/**
 * Exit app (Android only)
 */
export const exitApp = () => {
  if (getPlatform() === 'android') {
    CapApp.exitApp();
  }
};


/**
 * Get app info
 */
export const getAppInfo = async () => {
  if (!isNativePlatform()) {
    return {
      name: 'Tailor Management',
      version: '1.0.0',
      build: '1',
      platform: 'web'
    };
  }


  try {
    const info = await CapApp.getInfo();
    return {
      name: info.name,
      version: info.version,
      build: info.build,
      platform: getPlatform()
    };
  } catch (error) {
    console.error('Error getting app info:', error);
    return null;
  }
};


// Export all functions
export default {
  isNativePlatform,
  getPlatform,
  initializeMobileApp,
  initializeStatusBar,
  initializeSplashScreen,
  initializeBackButton,
  initializeAppStateListeners,
  showLoading,
  hideLoading,
  exitApp,
  getAppInfo
};



