# Solana Explorer - AI Coding Agent Instructions

> A Next.js 16 blockchain explorer for Solana supporting multiple clusters, protocol integrations (SPL tokens, Anchor programs, compressed NFTs), and real-time on-chain data inspection.

## Quick Start

**Build & Run:**
```bash
bun dev              # Development (port 3000, HMR enabled)
bun run build        # Production (webpack, NOT turbopack)
bun run test         # Vitest with jsdom environment
bun run lint         # ESLint validation
bun run gen          # Add shadcn/ui components interactively
```

**Key Setup Facts:**
- Path aliases required: `@components/*`, `@providers/*`, `@utils/*`, `@validators/*`, `@img/*` (see `tsconfig.json`)
- TypeScript strict mode enabled; `ignoreBuildErrors: true` temporarily in next.config for faster builds
- Uses `bun` package manager (not npm/yarn)
- BigInt serialization: Import `@/app/types/bigint` at TOP of any page/layout that serializes to JSON (applies toJSON polyfill globally)
- Environment variables: RPC URLs configurable via `.env.local` (e.g., `MAINNET_RPC_URL`, `DEVNET_RPC_URL`)
- Backup files: `.bak` files throughout codebase are intentional backups during refactoring - ignore them

## Architecture Overview

### Component & Page Structure

**Server/Client Pattern:**
- **Server pages** (`page.tsx`): Default - use for layout, data fetching at build/request time
- **Client pages** (`page-client.tsx`): MUST have `'use client'` at top - for hooks, interactivity, state
- **Server page imports client**: Allows passing server-fetched data as props to client components
- **Layout components**: Handle persistent UI (tabs, headers) - see `app/address/[address]/layout.tsx` for complex tab routing

**Key Example:** Address pages
```typescript
// app/address/[address]/page.tsx (server)
export default function AddressPage({ params }) {
  return <AddressLayout address={params.address} />; // Wraps client content
}

// app/address/[address]/layout.tsx (client, uses hooks)
'use client';
export default function AddressLayout({ children }) {
  const { cluster } = useCluster();  // OK - in 'use client'
  return <Tabs>{children}</Tabs>;
}
```

### State Management: Custom Cache Pattern

**Why not Redux/Zustand?** Solana RPC data is request-specific, not global app state. Custom pattern handles per-URL caching elegantly.

**Core Types** (`app/providers/cache.tsx`):
```typescript
enum FetchStatus { Fetching, FetchFailed, Fetched }
type CacheEntry<T> = { status: FetchStatus; data?: T }
```

**Provider Pattern** - Every data provider (accounts, transactions, blocks):
1. Exports a fetch function: `async fetchAccountInfo(url, address)`
2. Exports two hooks:
   - `useFetchAccountInfo()` - returns fetch function for manual triggers
   - `useAccountInfo(address)` - returns cached `CacheEntry<T>` or undefined

**Usage Example:**
```typescript
const { status: clusterStatus } = useCluster();
const accountCache = useAccountInfo(address);  // CacheEntry | undefined
const fetchAccount = useFetchAccountInfo();

if (accountCache?.status === FetchStatus.Fetching) return <LoadingCard />;
if (accountCache?.status === FetchStatus.FetchFailed) {
  return <ErrorCard retry={() => fetchAccount(pubkey, 'parsed')} />;
}
// accountCache.data available here
```

**See:** `app/providers/accounts/history.tsx`, `rewards.tsx`, `tokens.tsx` for implementations.

### Cluster Management

**ClusterProvider** (`app/providers/cluster.tsx`):
- Wraps entire app, manages RPC connection state
- Access via `useCluster()` hook → `{ cluster, customUrl, clusterInfo, status }`
- Status machine: `Connecting` → `Connected` | `Failure`
- Cluster selected via URL: `?cluster=devnet&customUrl=http://localhost:8899`
- RPC URLs: environment variables fallback (e.g., `MAINNET_RPC_URL`)

**Query Parameter Routing:**
```typescript
parseQuery(searchParams): Cluster.MainnetBeta | Cluster.Devnet | Cluster.Testnet | Cluster.Custom
// Parsed from ?cluster=devnet (default: mainnet-beta)
```

### Account Detail Pages (TABS_LOOKUP Pattern)

**Registration** (`app/address/[address]/layout.tsx` lines ~60+):
```typescript
const TABS_LOOKUP = {
  'spl-token-2022:mint': [
    { path: 'metadata', slug: 'metadata', title: 'Metadata' },
    { path: 'transfers', slug: 'transfers', title: 'Transfers' },
  ],
  // ... other account types
};
```

**Adding new protocol:**
1. Register in `TABS_LOOKUP` with path/slug/title
2. Create file: `app/address/[address]/[protocol]/page-client.tsx`
3. Use `ParsedAccountRenderer` component (see below)

### Reusable Component Patterns

**ParsedAccountRenderer** (`app/components/account/ParsedAccountRenderer.tsx`):
```typescript
<ParsedAccountRenderer
  address={address}
  renderComponent={({ account, onNotFound }) => {
    if (!isMyProtocol(account)) onNotFound();  // Redirects if invalid
    return <MyCardRenderer account={account} />;
  }}
/>
```

**Styling** - Always use `cn()` utility from `@components/shared/utils`:
```typescript
import { cn } from '@components/shared/utils';
export default function Card({ className }) {
  return <div className={cn('rounded-lg border', className)} />;
}
```

**UI System:** Tailwind + shadcn/ui with custom breakpoints:
- Breakpoints: `xxs(320px), xs(375px), sm(576px), md(768px), lg(992px), xl(1200px), xxl(1400px)`
- Dark mode: `class` strategy in `tailwind.config.ts`
- Components: `app/components/shared/ui/` (button, card, dialog, tabs, etc.)
- Add components: `bun run gen` (interactive) or `bunx shadcn@latest add [component]`
- Configuration: `components.json` defines component paths and styling
- Full design system spec: `docs/ui-system-spec.md` (color system, status badges, typography)

## Solana Integration Deep Dive

### RPC Layer: @solana/kit vs web3.js v1

**Current Status: 100% Migration Complete** ✅
- All **production code** uses `@solana/kit` (web3.js 2.0)
- Test files intentionally retain v1 patterns for mock compatibility
- Legacy adapters maintained for third-party library compatibility

**Use `@solana/kit` for:**
- Account fetching, balance checking, transaction status
- Block information, slot tracking
- Any modern RPC call

**Use legacy web3.js v1 + LegacyAdapter for:**
- Anchor programs: `adapter.getAnchorProgram(programId, idl)`
- Serum markets: `adapter.getSerumMarket(marketAddress)`
- Mango markets: `adapter.getMangoClient()`
- Metaplex NFTs: `adapter.getMetaplexNFT(mint)`
- Name services: `adapter.resolveSNS(domain)`, `adapter.resolveANS(domain)`

**RPC Utilities** (`@utils/rpc.ts`):
```typescript
createRpc(url)                           // → Rpc (kit)
createLegacyConnection(url, commitment)  // → Connection (v1)
toAddress(string | PublicKey)            // → Address (kit)
addressToPublicKey(Address)              // → PublicKey (v1)
toSignature(string)                      // → Signature (kit)
bigintToNumber(value)                    // → Safe number conversion
```

**Legacy Adapter** (`@utils/legacy-adapters.ts`):
```typescript
const adapter = new LegacyAdapter(rpcUrl, 'confirmed');
const program = adapter.getAnchorProgram(programId, idl);
// Pass adapter.getConnection() to third-party libraries requiring Connection
```

### Critical Webpack Workarounds

1. **Build Command:** `bun run build --webpack` (Turbopack breaks module resolution)
2. **Externals** (`next.config.mjs`): Anchor, Serum, Mango, Metaplex marked as external on client to prevent Node.js bundling
3. **SSR Prevention:** Check `typeof window === 'undefined'` before importing Anchor/Serum (see `app/components/instruction/serum/serum-utils.ts`)
4. **borsh v2:** Warning about `deserializeUnchecked` is expected; suppressed in webpack via `ignoreWarnings`
5. **Buffer Polyfill:** Webpack `ProvidePlugin` injects Buffer/process for browser compatibility
6. **postinstall Script:** Fixes CJS module issue for `@solana/spl-account-compression`

## Data Fetching & Async Patterns

### Provider Data Flow

**Typical fetch pattern** (`app/providers/accounts/index.tsx`):
```typescript
async function fetchAccount(rpc: Rpc, pubkey: PublicKey, encoding: 'parsed' | 'base64') {
  const account = await rpc.getAccount(toAddress(pubkey.toBase58()), { encoding }).send();
  // Parse account.data based on program
  return parsedAccount;
}

export function useAccountInfo(address: string) {
  const [state] = useReducer(clusterUrl);  // Cache keyed by RPC URL
  return state.entries[address]?.data;      // CacheEntry<Account> | undefined
}
```

### API Routes

Standard Next.js App Router pattern at `app/api/[endpoint]/route.ts`:
```typescript
export async function GET(request: Request) {
  const url = new URL(request.url);
  // Server-side only logic (Node.js APIs available)
  return Response.json({ data });
}
```

**Examples:** `app/api/anchor/`, `app/api/token-info/`, `app/api/metadata/proxy/`

## Development Workflows

### Testing

- **Config:** `vite.config.mts` + `vitest.workspace.ts`
- **Run:** `bun run test` (jsdom environment, jsdom globals enabled)
- **Watch:** `bun run test:watch`
- **Coverage:** `bun run coverage`
- **Location:** `__tests__/` directories adjacent to source files
- **Pattern:** `@testing-library/react` for component tests
- **Mocks:** See `app/__tests__/mocks.ts` for common patterns
- **Note:** Test files use web3.js v1 patterns for mock compatibility (production uses @solana/kit)

### Environment Setup

Create `.env.local` for custom RPC endpoints:
```bash
MAINNET_RPC_URL=https://your-mainnet-rpc.com
DEVNET_RPC_URL=https://api.devnet.solana.com
TESTNET_RPC_URL=https://api.testnet.solana.com
```

Fallback URLs are built-in if not specified.

### Adding New Protocols

1. **Create provider** `app/providers/[protocol].tsx`
   - Export fetch function and hooks (follow cache pattern)
2. **Create UI component** `app/components/account/[Protocol]Card.tsx`
   - Receive `Account` prop, render protocol-specific data
3. **Register tab** in `app/address/[address]/layout.tsx` → `TABS_LOOKUP`
4. **Create page** `app/address/[address]/[protocol]/page-client.tsx`
   - Use `ParsedAccountRenderer` + your component

### File Naming

- React components: `PascalCase` (`AccountHeader.tsx`)
- Utils/helpers: `camelCase` (`cluster.ts`, `token-info.ts`)
- Client pages: `page-client.tsx` (must have `'use client'`)
- Server pages: `page.tsx` (no directive)
- Tests: `*.spec.ts` or `*.test.ts` in `__tests__/`

## Common Patterns & Gotchas

| Gotcha | Solution |
|--------|----------|
| Import loops with relative paths | Always use path aliases: `@components/*`, `@utils/*`, etc. |
| BigInt in JSON responses | Import `@/app/types/bigint` polyfill in pages that serialize |
| Webpack bundling Node.js code | Check `next.config.mjs` externals; use `typeof window === 'undefined'` before Anchor/Serum imports |
| Stale RPC data across clusters | Cache is keyed by URL; `ClusterProvider` handles URL changes → new cache |
| Account not found errors | Redirect using `ParsedAccountRenderer`'s `onNotFound()` callback |
| TypeScript strict mode issues | Use `@utils/rpc.ts` type converters; strict mode enabled everywhere |

## Reference Files

- **Core:** `app/providers/cluster.tsx`, `cache.tsx`, `app/providers/accounts/index.tsx`
- **RPC Utilities:** `app/utils/rpc.ts`, `legacy-adapters.ts`
- **UI:** `app/components/shared/utils.ts` (cn function), `tailwind.config.ts`
- **Config:** `next.config.mjs` (webpack, externals), `tsconfig.json` (aliases), `package.json` (scripts)
- **Layout Example:** `app/address/[address]/layout.tsx` (TABS_LOOKUP registration)
