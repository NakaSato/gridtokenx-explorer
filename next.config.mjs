import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ADDRESS_ALIASES = ['account', 'accounts', 'addresses'];
const TX_ALIASES = ['txs', 'txn', 'txns', 'transaction', 'transactions'];
const SUPPLY_ALIASES = ['accounts', 'accounts/top'];

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Use webpack instead of turbopack for now due to package compatibility issues
    webpack: (config, { isServer }) => {
        config.resolve.alias = {
            ...(config.resolve.alias || {}),
            borsh: path.resolve(__dirname, 'node_modules/borsh'), // force legacy version
        };

        if (!isServer) {
            // Fixes npm packages that depend on Node.js modules in browser
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                os: false,
                path: false,
                crypto: false,
            };
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