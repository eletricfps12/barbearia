/**
 * Custom hook for haptic feedback
 * Provides vibration feedback on supported devices
 */
export const useHaptic = () => {
  const vibrate = (pattern) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (error) {
        console.log('Vibration not supported:', error);
      }
    }
  };

  return {
    // Light tap for selections
    light: () => vibrate(10),
    
    // Success feedback (3 short vibrations)
    success: () => vibrate([30, 50, 30]),
    
    // Error feedback (long vibration)
    error: () => vibrate(200),
  };
};
