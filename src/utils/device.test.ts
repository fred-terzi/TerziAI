/**
 * Tests for device detection utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { isMobileDevice, isTabletDevice, getDeviceInfo, shouldUseLowResourceMode } from './device';

describe('device detection', () => {
  beforeEach(() => {
    // Reset window dimensions
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  describe('isMobileDevice', () => {
    it('detects iPhone as mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      expect(isMobileDevice()).toBe(true);
    });

    it('detects Android phone as mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) Mobile Safari',
        writable: true,
        configurable: true,
      });

      expect(isMobileDevice()).toBe(true);
    });

    it('does not detect iPad as mobile (it is a tablet)', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      expect(isMobileDevice()).toBe(false);
    });

    it('does not detect Android tablet as mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-T510) Tablet Safari',
        writable: true,
        configurable: true,
      });

      expect(isMobileDevice()).toBe(false);
    });

    it('detects desktop as not mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });

      expect(isMobileDevice()).toBe(false);
    });

    it('detects small screen with touch as mobile', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/91.0',
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      Object.defineProperty(window, 'ontouchstart', { value: () => {}, writable: true });
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, writable: true });

      expect(isMobileDevice()).toBe(true);
    });
  });

  describe('isTabletDevice', () => {
    it('detects iPad as tablet', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      expect(isTabletDevice()).toBe(true);
    });

    it('detects Android tablet', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-T510) Tablet Safari',
        writable: true,
        configurable: true,
      });

      expect(isTabletDevice()).toBe(true);
    });

    it('does not detect phone as tablet', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });

      expect(isTabletDevice()).toBe(false);
    });

    it('does not detect desktop as tablet', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });

      expect(isTabletDevice()).toBe(false);
    });
  });

  describe('getDeviceInfo', () => {
    it('correctly identifies iOS device', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });
      // Set mobile screen size for iPhone
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });

      const info = getDeviceInfo();
      expect(info.platform).toBe('iOS');
      expect(info.isMobile).toBe(true);
      expect(info.isTablet).toBe(false);
      expect(info.isDesktop).toBe(false);
    });

    it('correctly identifies Android device', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) Mobile Safari',
        writable: true,
        configurable: true,
      });
      // Set mobile screen size for Android phone
      Object.defineProperty(window, 'innerWidth', { value: 412, writable: true });

      const info = getDeviceInfo();
      expect(info.platform).toBe('Android');
      expect(info.isMobile).toBe(true);
    });

    it('correctly identifies Windows desktop', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });

      const info = getDeviceInfo();
      expect(info.platform).toBe('Windows');
      expect(info.isMobile).toBe(false);
      expect(info.isTablet).toBe(false);
      expect(info.isDesktop).toBe(true);
    });

    it('correctly identifies macOS desktop', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/91.0',
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerWidth', { value: 1440, writable: true });

      const info = getDeviceInfo();
      expect(info.platform).toBe('macOS');
      expect(info.isDesktop).toBe(true);
    });
  });

  describe('shouldUseLowResourceMode', () => {
    it('returns true for mobile devices', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      expect(shouldUseLowResourceMode()).toBe(true);
    });

    it('returns false for desktop with sufficient memory', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
      Object.defineProperty(navigator, 'deviceMemory', { value: 8, writable: true });

      expect(shouldUseLowResourceMode()).toBe(false);
    });

    it('returns true for desktop with low memory', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });
      Object.defineProperty(navigator, 'deviceMemory', { value: 2, writable: true });

      expect(shouldUseLowResourceMode()).toBe(true);
    });
  });
});
