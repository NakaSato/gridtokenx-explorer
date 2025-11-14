import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADDRESS_ALIASES = ['account', 'accounts', 'addresses'];
const TX_ALIASES = ['txs', 'txn', 'txns', 'transaction', 'transactions'];
const SUPPLY_ALIASES = ['accounts', 'accounts/top'];

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Skip TypeScript checks temporarily for build
    typescript: {
        ignoreBuildErrors: true,
    },
    // Use empty turbopack config to silence warning and use webpack
    turbopack: {},
    // Keep webpack config for fallback
    webpack: (config, { isServer }) => {
        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            // Fix borsh import by pointing to the package root
            borsh: path.resolve(__dirname, 'node_modules/borsh'),
            'borsh/lib/index': path.resolve(__dirname, 'node_modules/borsh/lib/index.js'),
            // Fix for borsh import issues
            'borsh/lib': path.resolve(__dirname, 'node_modules/borsh/lib'),
        };

        // Ignore borsh import error for now
        config.ignoreWarnings = [
            ...(config.ignoreWarnings || []),
            /'deserializeUnchecked' is not exported from 'borsh'/,
        ];

        if (!isServer) {
            // Fixes npm packages that depend on Node.js modules in browser
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                os: false,
                path: false,
                crypto: false,
                stream: false,
                util: false,
                buffer: false,
            };

            // For client-side, make all problematic packages external to prevent bundling Node.js modules
            config.externals = config.externals || [];
            config.externals.push({
                // Anchor packages that use Node.js modules
                '@coral-xyz/anchor': 'commonjs @coral-xyz/anchor',
                '@coral-xyz/anchor/dist/cjs/nodewallet': 'commonjs @coral-xyz/anchor/dist/cjs/nodewallet',
                '@project-serum/anchor': 'commonjs @project-serum/anchor',
                '@project-serum/anchor/dist/esm/provider': 'commonjs @project-serum/anchor/dist/esm/provider',
                '@project-serum/anchor/dist/esm/workspace': 'commonjs @project-serum/anchor/dist/esm/workspace',
                '@project-serum/anchor/dist/esm/index': 'commonjs @project-serum/anchor/dist/esm/index',
                // Serum packages
                '@project-serum/serum': 'commonjs @project-serum/serum',
                '@project-serum/serum/lib/market-proxy/index': 'commonjs @project-serum/serum/lib/market-proxy/index',
                '@project-serum/serum/lib/market-proxy/middleware': 'commonjs @project-serum/serum/lib/market-proxy/middleware',
                // Metaplex and Bundlr packages
                '@metaplex-foundation/js': 'commonjs @metaplex-foundation/js',
                '@bundlr-network/client': 'commonjs @bundlr-network/client',
                'arbundles': 'commonjs arbundles',
                'avsc': 'commonjs avsc',
                // Solflare UTL SDK that uses Metaplex
                '@solflare-wallet/utl-sdk': 'commonjs @solflare-wallet/utl-sdk',
                // Node.js built-in modules
                'fs': 'fs',
                'os': 'os',
                'path': 'path',
                'crypto': 'crypto',
                'util': 'util',
                'stream': 'stream',
                'buffer': 'buffer',
            });
        }

        // Handle external dependencies that might cause issues
        config.externals = config.externals || [];
        if (isServer) {
            config.externals.push({
                '@coral-xyz/anchor': 'commonjs @coral-xyz/anchor',
                '@project-serum/anchor': 'commonjs @project-serum/anchor',
                '@metaplex-foundation/js': 'commonjs @metaplex-foundation/js',
                '@bundlr-network/client': 'commonjs @bundlr-network/client',
                'avsc': 'commonjs avsc',
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
                }))
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
