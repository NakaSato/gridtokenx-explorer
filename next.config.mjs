import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADDRESS_ALIASES = ['account', 'accounts', 'addresses'];
const TX_ALIASES = ['txs', 'txn', 'txns', 'transaction', 'transactions'];
const SUPPLY_ALIASES = ['accounts', 'accounts/top'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  // Skip TypeScript checks temporarily for build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Suppress console warnings
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Use empty turbopack config to silence warning and use webpack
  turbopack: {},
  // Suppress webpack warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Keep webpack config for fallback
  webpack: (config, { isServer, dev, webpack }) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // Fix borsh import by pointing to the package root
      borsh: path.resolve(__dirname, 'node_modules/borsh'),
      'borsh/lib/index': path.resolve(__dirname, 'node_modules/borsh/lib/index.js'),
      // Fix for borsh import issues
      'borsh/lib': path.resolve(__dirname, 'node_modules/borsh/lib'),
    };

    // Ignore borsh import error - known compatibility issue between web3.js v1 and borsh v2
    // Ignore bigint bindings warning - pure JS fallback works fine
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/@solana\/web3\.js/,
        message: /deserializeUnchecked/,
      },
      /deserializeUnchecked' is not exported from 'borsh'/,
      /bigint.*Failed to load bindings/,
    ];

      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          os: false,
          path: false,
          crypto: false,
          stream: false,
          util: false,
        };

        // Provide buffer polyfill for browser
        config.plugins.push(
          new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser',
          }),
        );
      }

    // Handle external dependencies that might cause issues
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push({
        '@coral-xyz/anchor': 'commonjs @coral-xyz/anchor',
        '@project-serum/anchor': 'commonjs @project-serum/anchor',
        '@metaplex-foundation/js': 'commonjs @metaplex-foundation/js',
        '@bundlr-network/client': 'commonjs @bundlr-network/client',
        '@blockworks-foundation/mango-client': 'commonjs @blockworks-foundation/mango-client',
        '@openbook-dex/openbook-v2': 'commonjs @openbook-dex/openbook-v2',
        avsc: 'commonjs avsc',
      });
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        hostname: 'raw.githubusercontent.com',
        pathname: '/solana-labs/token-list/main/assets/**',
        port: '',
        protocol: 'https',
      },
    ],
  },
  async redirects() {
    return [
      // Leave this above `ADDRESS_ALIASES`, since it also provides an alias for `/accounts`.
      ...SUPPLY_ALIASES.map(oldRoot => ({
        destination: '/supply',
        permanent: true,
        source: '/' + oldRoot,
      })),
      ...ADDRESS_ALIASES.flatMap(oldRoot =>
        [':address', ':address/:tab'].map(path => ({
          destination: '/' + ['address', path].join('/'),
          permanent: true,
          source: '/' + [oldRoot, path].join('/'),
        })),
      ),
      ...TX_ALIASES.map(oldRoot => ({
        destination: '/' + ['tx', ':signature'].join('/'),
        permanent: true,
        source: '/' + [oldRoot, ':signature'].join('/'),
      })),
      {
        destination: '/address/:address',
        permanent: true,
        source: '/address/:address/history',
      },
    ];
  },
};

export default nextConfig;
