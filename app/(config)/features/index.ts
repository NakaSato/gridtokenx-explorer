// Feature Flags Configuration
// Centralized feature flag management for the application

export interface FeatureFlags {
  // UI/UX Features
  enableDarkMode: boolean;
  enableCompactMode: boolean;
  enableAdvancedSearch: boolean;
  enableRealTimeUpdates: boolean;

  // Data Features
  enableTokenExtensions: boolean;
  enableNFTFeatures: boolean;
  enableDeFiFeatures: boolean;
  enableAnalytics: boolean;

  // Developer Features
  enableDeveloperMode: boolean;
  enableDebugMode: boolean;
  enableExperimentalFeatures: boolean;
  enableBetaFeatures: boolean;

  // Performance Features
  enableVirtualization: boolean;
  enableInfiniteScroll: boolean;
  enableLazyLoading: boolean;

  // Integration Features
  enableWalletConnection: boolean;
  enableSocialSharing: boolean;
  enableExportData: boolean;
  enableAPIDocumentation: boolean;
}

// Default feature flags
const defaultFlags: FeatureFlags = {
  // UI/UX Features
  enableDarkMode: true,
  enableCompactMode: false,
  enableAdvancedSearch: true,
  enableRealTimeUpdates: true,

  // Data Features
  enableTokenExtensions: true,
  enableNFTFeatures: true,
  enableDeFiFeatures: false, // Disabled by default
  enableAnalytics: true,

  // Developer Features
  enableDeveloperMode: false, // Opt-in
  enableDebugMode: false, // Development only
  enableExperimentalFeatures: false, // Opt-in
  enableBetaFeatures: false, // Opt-in

  // Performance Features
  enableVirtualization: true,
  enableInfiniteScroll: false, // Disabled for performance
  enableLazyLoading: true,

  // Integration Features
  enableWalletConnection: true,
  enableSocialSharing: true,
  enableExportData: true,
  enableAPIDocumentation: true,
};

// Environment-specific overrides
const environmentOverrides: Record<string, Partial<FeatureFlags>> = {
  development: {
    enableDebugMode: true,
    enableExperimentalFeatures: true,
    enableBetaFeatures: true,
  },
  production: {
    enableDebugMode: false,
    enableExperimentalFeatures: false,
  },
  test: {
    enableRealTimeUpdates: false, // Disabled for testing stability
    enableLazyLoading: false, // Disabled for testing
  },
};

// User preference overrides (from localStorage or user settings)
const userPreferenceOverrides: Partial<FeatureFlags> = {};

// Merge all configurations
function createFeatureFlags(): FeatureFlags {
  const env = process.env.NODE_ENV || 'development';
  const envOverride = environmentOverrides[env] || {};

  return {
    ...defaultFlags,
    ...envOverride,
    ...userPreferenceOverrides,
  };
}

export const featureFlags = createFeatureFlags();

// Runtime feature flag access
export function getFeatureFlags(): FeatureFlags {
  return featureFlags;
}

// Individual feature flag checkers
export function isFeatureEnabled<K extends keyof FeatureFlags>(feature: K): boolean {
  return featureFlags[feature];
}

// Feature flag groups for easier management
export const featureGroups = {
  ui: ['enableDarkMode', 'enableCompactMode', 'enableAdvancedSearch', 'enableRealTimeUpdates'] as const,
  data: ['enableTokenExtensions', 'enableNFTFeatures', 'enableDeFiFeatures', 'enableAnalytics'] as const,
  developer: ['enableDeveloperMode', 'enableDebugMode', 'enableExperimentalFeatures', 'enableBetaFeatures'] as const,
  performance: ['enableVirtualization', 'enableInfiniteScroll', 'enableLazyLoading'] as const,
  integration: ['enableWalletConnection', 'enableSocialSharing', 'enableExportData', 'enableAPIDocumentation'] as const,
};

// Group-based feature flag checkers
export function isFeatureGroupEnabled(group: keyof typeof featureGroups): boolean {
  const features = featureGroups[group];
  return features.some(feature => isFeatureEnabled(feature));
}

// Dynamic feature flag updates (for user preferences)
export function updateFeatureFlag<K extends keyof FeatureFlags>(feature: K, value: FeatureFlags[K]): void {
  (featureFlags as any)[feature] = value;

  // Persist to localStorage if needed
  if (typeof window !== 'undefined') {
    const userFlags = JSON.parse(localStorage.getItem('userFeatureFlags') || '{}');
    userFlags[feature] = value;
    localStorage.setItem('userFeatureFlags', JSON.stringify(userFlags));
  }
}

// Load user preference flags from localStorage
export function loadUserFeatureFlags(): void {
  if (typeof window !== 'undefined') {
    const userFlags = JSON.parse(localStorage.getItem('userFeatureFlags') || '{}');
    Object.assign(userPreferenceOverrides, userFlags);
    Object.assign(featureFlags, userFlags);
  }
}

// Feature flag validation
export function validateFeatureFlags(): void {
  const requiredFeatures: (keyof FeatureFlags)[] = [];
  const missingFeatures = requiredFeatures.filter(feature => !(feature in featureFlags));

  if (missingFeatures.length > 0) {
    console.warn(`Missing feature flags: ${missingFeatures.join(', ')}`);
  }
}

// Initialize feature flags
export function initializeFeatureFlags(): void {
  loadUserFeatureFlags();
  validateFeatureFlags();
}
