/**
 * Device detection utilities
 * Detects mobile devices and platform characteristics
 */

/**
 * Device type information
 */
export interface DeviceInfo {
  /** Whether the device is a mobile phone */
  isMobile: boolean;
  /** Whether the device is a tablet */
  isTablet: boolean;
  /** Whether the device is a desktop */
  isDesktop: boolean;
  /** Platform name (iOS, Android, etc.) */
  platform: string;
  /** User agent string */
  userAgent: string;
}

/**
 * Detect if the current device is a mobile phone
 * Uses multiple heuristics for better accuracy
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || '';

  // Check for tablet-specific patterns first (to exclude them from mobile)
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet|tablet/i;
  const isTablet = tabletRegex.test(userAgent);

  // If it's a tablet, it's not a mobile phone
  if (isTablet) {
    return false;
  }

  // Check for mobile keywords in user agent (excluding tablets)
  const mobileRegex = /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;
  const hasMobileUA = mobileRegex.test(userAgent);

  // Check viewport width (mobile phones typically < 768px)
  const hasSmallScreen = window.innerWidth < 768;

  // Check for touch support (mobile/tablet indicator)
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Mobile device is one that:
  // 1. Has mobile UA (and NOT tablet), OR
  // 2. Has small screen AND touch support (and NOT tablet)
  const isMobile = hasMobileUA || (hasSmallScreen && hasTouch);

  return isMobile;
}

/**
 * Detect if the current device is a tablet
 */
export function isTabletDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || '';

  // Check for tablet-specific patterns
  const tabletRegex = /iPad|Android(?!.*Mobile)|Tablet|tablet/i;
  const isTablet = tabletRegex.test(userAgent);

  // Check viewport width (tablets typically between 768px and 1024px)
  const hasTabletScreen = window.innerWidth >= 768 && window.innerWidth <= 1024;

  // Check for touch support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return isTablet || (hasTabletScreen && hasTouch);
}

/**
 * Get comprehensive device information
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof navigator === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      platform: 'unknown',
      userAgent: '',
    };
  }

  const isMobile = isMobileDevice();
  const isTablet = isTabletDevice();
  const isDesktop = !isMobile && !isTablet;

  const userAgent = navigator.userAgent || '';
  let platform = 'unknown';

  // Detect platform
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    platform = 'iOS';
  } else if (/Android/i.test(userAgent)) {
    platform = 'Android';
  } else if (/Windows/i.test(userAgent)) {
    platform = 'Windows';
  } else if (/Mac/i.test(userAgent)) {
    platform = 'macOS';
  } else if (/Linux/i.test(userAgent)) {
    platform = 'Linux';
  }

  return {
    isMobile,
    isTablet,
    isDesktop,
    platform,
    userAgent,
  };
}

/**
 * Check if device should use conservative resource limits
 * Returns true for mobile phones and low-memory devices
 */
export function shouldUseLowResourceMode(): boolean {
  const deviceInfo = getDeviceInfo();

  // Mobile phones should always use low resource mode
  if (deviceInfo.isMobile) {
    return true;
  }

  // Check device memory if available
  if ('deviceMemory' in navigator && typeof navigator.deviceMemory === 'number') {
    // Less than 4GB RAM should use low resource mode
    return navigator.deviceMemory < 4;
  }

  // Default to false for desktop/unknown
  return false;
}
