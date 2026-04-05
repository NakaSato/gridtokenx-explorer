# GridTokenX Explorer - Project Context

## Project Overview

**GridTokenX Explorer** is a fork of the Solana Explorer - a comprehensive web application for inspecting and exploring the Solana blockchain. This customized version is tailored for the GridTokenX platform, providing specialized support for GridTokenX program IDs and protocol integrations.

### Purpose
- Browse transactions, accounts, blocks, and other on-chain data
- Support for GridTokenX custom programs (Registry, Oracle, Governance, Token, Trading)
- Protocol integrations for inspecting various types of transactions and instructions
- Local development support with custom RPC endpoints

### Technology Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16.1.6 (App Router) |
| **Language** | TypeScript 5.9.3, React 19.2.4 |
| **Styling** | Tailwind CSS v4, shadcn/ui (New York style) |
| **UI Components** | Radix UI, Mantine hooks, Nivo charts, Recharts |
| **Solana SDK** | @solana/kit 6.1.0, @solana/web3.js 1.98.4, @coral-xyz/anchor 0.32.1 |
| **Testing** | Vitest 4.0.18, Testing Library, Playwright |
| **Package Manager** | Bun |
| **Build Tool** | Webpack (via Next.js) |

## Project Structure

```
gridtokenx-explorer/
├── app/                          # Next.js App Router directory
│   ├── (core)/                   # Core components & providers
│   │   ├── components/           # Core UI components (Navbar, SearchBar, etc.)
│   │   └── providers/            # React providers (Cluster, ScrollAnchor)
│   ├── (features)/               # Feature modules
│   │   ├── accounts/             # Account inspection features
│   │   ├── transactions/         # Transaction viewing
│   │   ├── blocks/               # Block exploration
│   │   ├── search/               # Search functionality
│   │   └── anchor-localnet/      # Local development support
│   ├── (shared)/                 # Shared utilities & components
│   │   ├── components/           # Reusable UI components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # API services
│   │   ├── types/                # TypeScript types
│   │   └── utils/                # Utility functions
│   ├── (config)/                 # Configuration modules
│   │   ├── env/                  # Environment configuration
│   │   ├── features/             # Feature flags
│   │   └── themes/               # Theme configuration
│   ├── address/                  # Address detail pages
│   ├── tx/                       # Transaction detail pages
│   ├── block/                    # Block detail pages
│   ├── supply/                   # Token supply information
│   ├── validators/               # Validator information
│   ├── epoch/                    # Epoch data
│   └── feature-gates/            # Feature gate status
├── docs/                         # Documentation
├── scripts/                      # Utility scripts
│   ├── fetch_mainnet_activations.py
│   └── parse_feature_gates.py
├── public/                       # Static assets
├── .env.example                  # Environment variables template
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
├── vitest.workspace.ts           # Vitest testing configuration
└── vite.config.mts               # Vite configuration for tests
```

## Building and Running

### Prerequisites
- **Bun** (recommended) or npm/yarn
- **Node.js** 18+
- **Solana RPC endpoint** (local or remote)
- **OrbStack** (required Docker runtime for GridTokenX development)

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Start development server
bun run dev

# Development with webpack (recommended)
bun run dev:webpack
```

### Building

```bash
# Production build
bun run build
```

### Running Production

```bash
# Start production server
bun run start
```

### Testing

```bash
# Run tests
bun run test

# Run tests with coverage
bun run coverage

# Run tests in watch mode
bun run test:watch

# CI test run
bun run test:ci
```

### Code Quality

```bash
# Lint code
bun run lint

# Format code
bun run format

# Format check (CI)
bun run format:ci
```

### Docker

```bash
# Build Docker image
docker build -t gridtokenx-explorer .

# Run container
docker run -p 4000:4000 gridtokenx-explorer
```

## Environment Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
# RPC URLs (required for local development)
NEXT_PUBLIC_MAINNET_RPC_URL=<your-mainnet-rpc>
NEXT_PUBLIC_DEVNET_RPC_URL=<your-devnet-rpc>
NEXT_PUBLIC_TESTNET_RPC_URL=<your-testnet-rpc>

# Local development (solana-test-validator)
NEXT_PUBLIC_SOLANA_RPC_HTTP=http://localhost:8899
NEXT_PUBLIC_SOLANA_RPC_WS=ws://localhost:8900

# Network selection
NEXT_PUBLIC_SOLANA_NETWORK=localnet

# GridTokenX Program IDs (update after deployment)
NEXT_PUBLIC_REGISTRY_PROGRAM_ID=<your-registry-program-id>
NEXT_PUBLIC_ORACLE_PROGRAM_ID=<your-oracle-program-id>
NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID=<your-governance-program-id>
NEXT_PUBLIC_TOKEN_PROGRAM_ID=<your-token-program-id>
NEXT_PUBLIC_TRADING_PROGRAM_ID=<your-trading-program-id>

# API Gateway
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8080
```

## Development Conventions

### Code Style
- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier with custom configuration (`.prettierrc.cjs`)
- **Linting**: ESLint with Next.js and Solana configurations
- **Import Aliases**:
  - `@/*` - Root directory
  - `@components/*` - `./app/components`
  - `@providers/*` - `./app/providers`
  - `@utils/*` - `./app/utils`
  - `@validators/*` - `./app/validators`
  - `@img/*` - `./app/img`

### Component Architecture
- Uses **shadcn/ui** component library (New York style)
- Components organized by feature in `(features)` directory
- Shared components in `(shared)/components`
- Core layout components in `(core)/components`

### Testing Practices
- **Framework**: Vitest with jsdom environment
- **Testing Library**: React Testing Library for component tests
- **E2E**: Playwright for browser testing
- **Test Files**: Located alongside source code in `__tests__` directories
- **Setup**: Global test setup in `test-setup.ts`

### Key Considerations

1. **Solana Web3 Compatibility**: The project handles known compatibility issues between `@solana/web3.js` v1 and `borsh` v2 through webpack configuration and postinstall scripts.

2. **Client-Side Rendering**: Many components use client-side rendering due to Solana SDK dependencies. The project uses `use client` directives where needed.

3. **Polyfills**: Browser polyfills for `Buffer`, `process`, and other Node.js globals are configured in webpack for Solana SDK compatibility.

4. **Cluster Support**: Supports multiple clusters (localnet, devnet, testnet, mainnet) via the ClusterProvider context.

5. **Performance**: Uses SWR for data fetching and caching, with React.lazy/Suspense for code splitting.

## Contributing Guidelines

Based on the README:

1. **Read CONTRIBUTING.md** (if exists) for detailed contribution process
2. **Include tests** for all new features, especially protocol integrations
3. **Ensure CI passes** before submitting pull requests
4. **Provide screenshots** for UI changes, particularly for protocol screens
5. **Use GitHub Issues** for bug reports and feature requests
6. **Security disclosures** should be sent to disclosures@solana.org

## Key Dependencies

### Solana Ecosystem
- `@solana/kit` - Solana JavaScript SDK
- `@coral-xyz/anchor` - Anchor framework for Solana programs
- `@solana/spl-token` - SPL Token program client
- `@metaplex-foundation/mpl-token-metadata` - Metaplex NFT metadata
- `@bonfida/spl-name-service` - Solana Name Service
- `@onsol/tldparser` - TLD parser for Solana

### UI/UX
- `radix-ui` - Headless UI components
- `@radix-ui/react-*` - Individual Radix components
- `lucide-react` - Icon library
- `nivo/*` - Data visualization charts
- `recharts` - Additional charting library
- `next-themes` - Dark/light theme support

### Utilities
- `bignumber.js`, `bn.js` - Big number arithmetic
- `borsh` - Binary serialization
- `bs58` - Base58 encoding
- `date-fns` - Date formatting
- `swr` - Data fetching and caching
- `zod` - Schema validation (via shadcn)

## Common Tasks

### Adding a New Feature Page
1. Create directory in `app/(features)/your-feature/`
2. Add `page.tsx` for the route
3. Create components in `app/(shared)/components/`
4. Add tests in `__tests__/` subdirectory
5. Update feature flags in `app/(config)/features/` if needed

### Adding Protocol Integration
1. Create parser/validator in `app/validators/`
2. Add UI components for displaying protocol data
3. Include comprehensive tests
4. Document the integration

### Modifying Theme
1. Update CSS variables in `app/globals.css`
2. Modify `tailwind.config.ts` for theme extensions
3. Test both light and dark modes

## Troubleshooting

### Common Issues

**Borsh Import Errors**: Known compatibility issue between web3.js v1 and borsh v2. The postinstall script and webpack configuration handle this automatically.

**Rate Limiting**: Use custom RPC URLs in `.env.local` to avoid rate limiting during development.

**Build Errors**: TypeScript checks are skipped during build (`ignoreBuildErrors: true`). Run `tsc --noEmit` separately for type checking.

**Webpack Warnings**: Certain warnings are suppressed in `next.config.mjs` for known Solana SDK compatibility issues.
