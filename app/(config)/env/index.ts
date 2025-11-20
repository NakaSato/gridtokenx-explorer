// Environment Configuration
// Centralized environment variable management

export interface EnvConfig {
  // Solana RPC Configuration
  solanaRpcHttp?: string;
  solanaRpcWs?: string;

  // Application URLs
  nextPublicUrl: string;

  // Feature Flags
  enableCustomRpc: boolean;
  enableAnalytics: boolean;
  enableFeatureGates: boolean;

  // API Configuration
  coingeckoApiKey?: string;

  // Development Settings
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

// Default configuration
const defaultConfig: EnvConfig = {
  nextPublicUrl: process.env.NEXT_PUBLIC_URL || 'https://explorer.gridtokenx.com',
  solanaRpcHttp: process.env.NEXT_PUBLIC_SOLANA_RPC_HTTP,
  solanaRpcWs: process.env.NEXT_PUBLIC_SOLANA_RPC_WS,
  enableCustomRpc: process.env.NEXT_PUBLIC_ENABLE_CUSTOM_RPC === 'true',
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  enableFeatureGates: process.env.NEXT_PUBLIC_ENABLE_FEATURE_GATES !== 'false',
  coingeckoApiKey: process.env.COINGECKO_API_KEY,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Environment-specific configurations
const configs: Record<string, Partial<EnvConfig>> = {
  development: {
    enableCustomRpc: true,
    enableAnalytics: false,
  },
  production: {
    enableCustomRpc: false,
    enableAnalytics: true,
  },
  test: {
    enableCustomRpc: false,
    enableAnalytics: false,
  },
};

// Merge configurations
function createConfig(): EnvConfig {
  const env = process.env.NODE_ENV || 'development';
  const envSpecificConfig = configs[env] || {};

  return {
    ...defaultConfig,
    ...envSpecificConfig,
  };
}

export const envConfig = createConfig();

// Validation helpers
export function validateEnvConfig(): void {
  const requiredVars = ['NEXT_PUBLIC_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// Runtime configuration access
export function getEnvConfig(): EnvConfig {
  return envConfig;
}

// Feature flag helpers
export function isFeatureEnabled(feature: keyof EnvConfig): boolean {
  const value = envConfig[feature];
  return typeof value === 'boolean' ? value : !!value;
}

// Environment variable utility
export function isEnvEnabled(variable: undefined | string) {
  return variable === 'true';
}
