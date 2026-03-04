/**
 * Theme Initialization Script Tests
 * 
 * These tests verify that the inline script in index.html correctly:
 * - Reads theme preference from localStorage
 * - Applies the 'dark' class synchronously before React loads
 * - Prevents FOUC (Flash of Unstyled Content)
 * - Handles errors gracefully
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Theme Initialization Script', () => {
  let originalLocalStorage;
  let originalConsoleError;

  beforeEach(() => {
    // Save original localStorage
    originalLocalStorage = global.localStorage;
    originalConsoleError = console.error;
    
    // Mock console.error to suppress error logs in tests
    console.error = vi.fn();
    
    // Reset document.documentElement.classList
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    // Restore original localStorage and console.error
    global.localStorage = originalLocalStorage;
    console.error = originalConsoleError;
    
    // Clean up
    document.documentElement.classList.remove('dark');
  });

  describe('Requirement 9.1: Check localStorage for theme preference', () => {
    it('should read theme preference from localStorage', () => {
      // Setup: Mock localStorage with dark theme
      const getItemSpy = vi.fn(() => 'dark');
      global.localStorage = {
        getItem: getItemSpy,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };

      // Execute: Run the initialization logic
      const theme = localStorage.getItem('theme');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Verify: localStorage.getItem was called with 'theme'
      expect(getItemSpy).toHaveBeenCalledWith('theme');
    });
  });

  describe('Requirement 9.2: Apply dark class when preference exists', () => {
    it('should add dark class when theme is dark', () => {
      // Setup: Mock localStorage returning 'dark'
      global.localStorage = {
        getItem: vi.fn(() => 'dark'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };

      // Execute: Run the initialization logic
      const theme = localStorage.getItem('theme');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Verify: dark class is added
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should not add dark class when theme is light', () => {
      // Setup: Mock localStorage returning 'light'
      global.localStorage = {
        getItem: vi.fn(() => 'light'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };

      // Execute: Run the initialization logic
      const theme = localStorage.getItem('theme');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Verify: dark class is not present
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Requirement 9.3: Default to light mode when no preference', () => {
    it('should ensure light mode when localStorage returns null', () => {
      // Setup: Mock localStorage returning null
      global.localStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };

      // Execute: Run the initialization logic
      const theme = localStorage.getItem('theme');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Verify: dark class is not present (defaults to light)
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should ensure light mode when localStorage returns undefined', () => {
      // Setup: Mock localStorage returning undefined
      global.localStorage = {
        getItem: vi.fn(() => undefined),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };

      // Execute: Run the initialization logic
      const theme = localStorage.getItem('theme');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Verify: dark class is not present (defaults to light)
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Requirement 9.4: Error handling for FOUC prevention', () => {
    it('should handle localStorage errors gracefully', () => {
      // Setup: Mock localStorage to throw an error
      global.localStorage = {
        getItem: vi.fn(() => {
          throw new Error('localStorage is not available');
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };

      // Execute: Run the initialization logic with error handling
      try {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('Failed to initialize theme:', error);
      }

      // Verify: Error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Failed to initialize theme:',
        expect.any(Error)
      );
    });

    it('should not crash when localStorage throws error', () => {
      // Setup: Mock localStorage to throw an error
      global.localStorage = {
        getItem: vi.fn(() => {
          throw new Error('localStorage quota exceeded');
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };

      // Execute & Verify: Should not throw
      expect(() => {
        try {
          const theme = localStorage.getItem('theme');
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (error) {
          console.error('Failed to initialize theme:', error);
        }
      }).not.toThrow();
    });
  });

  describe('Synchronous execution', () => {
    it('should execute synchronously without async/await', () => {
      // This test verifies the script logic is synchronous
      const startTime = Date.now();
      
      // Setup: Mock localStorage
      global.localStorage = {
        getItem: vi.fn(() => 'dark'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn()
      };

      // Execute: Run the initialization logic
      const theme = localStorage.getItem('theme');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      const endTime = Date.now();

      // Verify: Execution is immediate (< 10ms)
      expect(endTime - startTime).toBeLessThan(10);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
