/**
 * Local storage utilities for the application
 */

/**
 * Checks if localStorage is available in the current environment
 * @returns boolean indicating if localStorage is available
 */
export function localStorageIsAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Safely gets an item from localStorage
 * @param key - The key to retrieve
 * @returns The value or null if not available
 */
export function localStorageGetItem(key: string): string | null {
  if (!localStorageIsAvailable()) {
    return null;
  }

  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`Failed to get item from localStorage: ${key}`, e);
    return null;
  }
}

/**
 * Safely sets an item in localStorage
 * @param key - The key to set
 * @param value - The value to store
 * @returns boolean indicating success
 */
export function localStorageSetItem(key: string, value: string): boolean {
  if (!localStorageIsAvailable()) {
    return false;
  }

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`Failed to set item in localStorage: ${key}`, e);
    return false;
  }
}

/**
 * Safely removes an item from localStorage
 * @param key - The key to remove
 * @returns boolean indicating success
 */
export function localStorageRemoveItem(key: string): boolean {
  if (!localStorageIsAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`Failed to remove item from localStorage: ${key}`, e);
    return false;
  }
}

/**
 * Safely clears all items from localStorage
 * @returns boolean indicating success
 */
export function localStorageClear(): boolean {
  if (!localStorageIsAvailable()) {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (e) {
    console.warn('Failed to clear localStorage', e);
    return false;
  }
}
