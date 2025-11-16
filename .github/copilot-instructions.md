# Solana Explorer - AI Coding Agent Instructions

## Project Overview

This is a Next.js 16 blockchain explorer for Solana, allowing users to inspect transactions, accounts, blocks, and on-chain data. The app supports multiple Solana clusters (mainnet-beta, testnet, devnet, custom) and integrates with numerous Solana protocols (SPL tokens, Anchor programs, compressed NFTs, etc.).

## Architecture & Key Patterns

### Next.js App Router Structure
- **Server components by default**: Most pages are server-rendered unless they use hooks or client interactivity
- **Client components marked explicitly**: Files using React hooks MUST have `'use client'` directive at the top
- **Page patterns**: 
  - Server page at `app/[route]/page.tsx` imports client component
  - Client logic in `app/[route]/page-client.tsx` with `'use client'` directive
  - Layout components handle tabs and shared UI (see `app/address/[address]/layout.tsx`)

### Path Aliases (Critical for imports)
```typescript
@components/* → ./app/components/*
@providers/* → ./app/providers/*
@utils/* → ./app/utils/*
@validators/* → ./app/validators/*
@img/* → ./app/img/*
```
Always use these aliases. Never use relative paths like `../../components/`.

### Cluster Management Pattern
- **ClusterProvider** wraps the entire app (`app/providers/cluster.tsx`)
- Cluster selection via URL query params: `?cluster=devnet&customUrl=http://localhost:8899`
- Access cluster state via `useCluster()` hook
- RPC URLs configured per cluster with environment variable fallbacks
- State machine: `Connecting` → `Connected` | `Failure`

### State Management via Cache Provider Pattern
The app uses a custom cache provider pattern (not Redux/Zustand):
```typescript
// app/providers/cache.tsx defines:
enum FetchStatus { Fetching, FetchFailed, Fetched }
type CacheEntry<T> = { status: FetchStatus; data?: T }

// Usage pattern in all providers (accounts, transactions, blocks):
const [state, dispatch] = useReducer(url);
dispatch({ type: ActionType.Update, key, status, data });
```

**Example**: `app/providers/accounts/` - see `history.tsx`, `tokens.tsx`, `rewards.tsx`
- Each provider exports: fetch function + custom hook
- Hook pattern: `useFetchAccountInfo()` + `useAccountInfo(address)`

### Component Architecture

#### ParsedAccountRenderer Pattern
Reusable account detail page pattern (see `app/address/[address]/concurrent-merkle-tree/page-client.tsx`):
```tsx
import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';

export function MyAccountPage({ address }: { address: string }) {
  return <ParsedAccountRenderer 
    address={address} 
    renderComponent={MyCardRenderer} 
  />;
}

// Renderer receives: { account, onNotFound }
function MyCardRenderer({ account, onNotFound }) {
  if (!isValidAccount(account)) onNotFound();
  return <div>...</div>;
}
```

#### Styling with Tailwind & shadcn/ui
- **Utility function**: `cn()` from `@components/shared/utils` merges Tailwind classes
- **shadcn/ui components**: Located in `app/components/shared/ui/`
- **UI System Spec**: Complete specification in `docs/ui-system-spec.md`
- **Dark mode**: Implemented via `class` strategy (see `tailwind.config.ts`)
- **Theme toggle**: Managed by `ThemeProvider` in `app/providers/theme.tsx`
- **Custom breakpoints**: `xxs, xs, sm, md, lg, xl, xxl` (see `tailwind.config.ts`)

```tsx
import { cn } from '@components/shared/utils';
<div className={cn('card', 'hover:shadow-lg', className)} />
```

#### Available shadcn/ui Components
All installed in `app/components/shared/ui/`:
- accordion, alert, badge, button, card, dialog, dropdown-menu
- input, label, popover, progress, scroll-area, select
- separator, skeleton, switch, table, tabs, textarea, tooltip

Add new components: `bun run gen` or `bunx shadcn@latest add [component]`

### API Routes Pattern
Next.js App Router API routes at `app/api/[endpoint]/route.ts`:
```typescript
export async function GET(request: Request) {
  // Server-side only logic
  return Response.json({ data });
}
```
Examples: `app/api/anchor/`, `app/api/token-info/`, `app/api/metadata/proxy/`

### Data Visualization with Nivo
- **Charts library**: Use [Nivo](https://nivo.rocks/) for all data visualizations
- **Installation**: `bun add @nivo/core @nivo/line @nivo/bar @nivo/pie`
- **Theme integration**: Use semantic color tokens (`hsl(var(--foreground))`) for dark mode support
- **Common charts**: ResponsiveLine, ResponsiveBar, ResponsivePie, ResponsiveArea
- **Wrapper pattern**: Combine with shadcn/ui Card components for consistent layouts

```tsx
import { ResponsiveLine } from '@nivo/line';
import { Card, CardContent, CardHeader, CardTitle } from '@components/shared/ui/card';

<Card>
  <CardHeader><CardTitle>Chart Title</CardTitle></CardHeader>
  <CardContent>
    <div className="h-[300px]">
      <ResponsiveLine
        data={data}
        theme={{
          text: { fill: 'hsl(var(--foreground))' },
          grid: { line: { stroke: 'hsl(var(--border))' } }
        }}
      />
    </div>
  </CardContent>
</Card>
```

See `docs/ui-system-spec.md` for complete Nivo integration patterns.

### Solana Integration Specifics

#### RPC Layer
- **Primary**: Uses `@solana/kit` (web3.js 2.0) for modern RPC calls
  - `ClusterProvider` uses `createSolanaRpc(url)` for cluster management
  - `EpochProvider`, `RichListProvider`, and `BlockProvider` fully migrated to @solana/kit
  - `TransactionProvider` (parsed.tsx) migrated to kit with type converters
  - `TransactionStatusProvider` (index.tsx) migrated to kit for signature status checking
  - `AccountProvider` (index.tsx) migrated to kit for batch account fetching
  - `AccountHistoryProvider`, `TokensProvider`, and `VoteAccountsProvider` migrated to kit
  - `RewardsProvider` migrated to kit
  - `SupplyProvider` and `SolanaClusterStatsProvider` migrated to kit
  - New code should prefer `createRpc()` from `@utils/rpc.ts`
- **Legacy**: `@solana/web3.js` v1 maintained for:
  - Transaction decompiling (TransactionMessage.decompile in raw.tsx)
  - Parsed account validation (uses v1-specific validators in accounts/index.tsx)
  - Third-party library compatibility (Anchor, SPL, Metaplex, Mango, Serum)
  - Use `LegacyAdapter` from `@utils/legacy-adapters.ts` for these integrations
- **Helper utilities** in `@utils/rpc.ts`:
  - `createRpc(url)`: Create @solana/kit RPC client
  - `createLegacyConnection(url, commitment)`: Create v1 Connection when needed
  - Type conversion utilities: 
    - `toAddress()`, `toSignature()`: Convert to kit types
    - `publicKeyToAddress()`, `addressToPublicKey()`: Convert between formats
    - `bigintToNumber()`: Safe bigint to number conversion
    - `toLegacyAccountInfo()`, `toLegacyBlockResponse()`, `toLegacyParsedTransaction()`, `toLegacySignatureInfo()`: Convert kit responses to legacy format
- **Legacy Adapter** in `@utils/legacy-adapters.ts`:
  - `createLegacyAdapter(url)`: Create adapter for third-party libraries
  - Methods: `getAnchorProgram()`, `getSerumMarket()`, `getMangoClient()`, `getMetaplexNFT()`, `resolveSNS()`, `resolveANS()`
- **Migration strategy**: See `docs/SOLANA_KIT_MIGRATION_PLAN.md` for comprehensive migration roadmap
  - Current status: ~80% migrated - **All production code paths complete!** \u2705
  - Phase 1 complete: Type converters and test suite
  - Phase 2 complete: All provider layer migrations (13 files)
  - Phase 3 complete: All UI components (39 files total)
    - Phase 3.1: Block components (4 files)
    - Phase 3.2: Account components (21 files)
    - Phase 3.3: NFToken components (1 file)
    - Phase 3.4: Transaction & Inspector components (6 files)
    - Phase 3.5: Instruction Parsers & Common components (7 files)
  - Phase 4 complete: API Routes & Utilities (4 files)
  - Key migrated files: All providers, all UI components, anchor route, name-service, verified-builds, kit-wrapper
  - **All production UI and API code migrated** \ud83c\udf89
  - Test files intentionally retain v1 patterns for mock data
  - Legacy adapters maintained for third-party library compatibility (Anchor, Serum, Mango)

#### Critical Workarounds
1. **borsh deserialization**: `postinstall` script fixes CJS module issue for `@solana/spl-account-compression`
2. **Webpack config**: Extensive client-side externals for Node.js-dependent packages (Anchor, Serum)
3. **Build with webpack**: `next build --webpack` (Turbopack disabled due to module resolution issues)
4. **Serum/Anchor SSR prevention**: Use wrapper pattern in `app/components/instruction/serum/serum-utils.ts` to prevent Node.js module loading during SSR. Always check `typeof window === 'undefined'` before importing these packages.
5. **borsh v2 compatibility**: Warning about `deserializeUnchecked` not exported from borsh is expected - it's a compatibility issue between `@solana/web3.js` v1 and `borsh` v2. The warning is suppressed in webpack builds via `ignoreWarnings` and doesn't affect functionality.
6. **Buffer polyfill**: Uses webpack `ProvidePlugin` to inject Buffer and process polyfills for browser compatibility with Solana packages.

## Development Workflows

### Build & Development
```bash
bun dev                  # Development server (port 3000)
bun run build            # Production build (uses webpack)
bun run test             # Run Vitest specs
bun run test:watch       # Watch mode
bun run lint             # ESLint
bun run format           # Prettier check
bun run gen              # Add shadcn/ui components
```

### Testing with Vitest
- Config: `vite.config.mts` + `vitest.workspace.ts`
- Tests in `__tests__/` directories adjacent to source files
- Uses `@testing-library/react` for component tests
- Mock patterns: See `app/__tests__/mocks.ts` and `mock-stubs.ts`

### Adding New Protocol Support
1. Create provider in `app/providers/[protocol].tsx` with fetch + hook
2. Add account renderer in `app/components/account/[Protocol]Card.tsx`
3. Register in `app/address/[address]/layout.tsx` TABS_LOOKUP
4. Create route at `app/address/[address]/[protocol]/page-client.tsx`

## Common Gotchas

### Module Resolution
- **Never externalize in webpack on accident**: Check `next.config.mjs` before adding new Solana dependencies
- **BigInt serialization**: Import `@/app/types/bigint` polyfill in pages that serialize BigInt to JSON

### TypeScript
- `typescript.ignoreBuildErrors: true` in next.config (temporary for faster builds)
- Custom type definitions: `app/types/` directory
- Strict mode enabled

### Environment Variables
- Client: `NEXT_PUBLIC_*` prefix required
- Server: No prefix needed
- RPC URLs: `MAINNET_RPC_URL`, `DEVNET_RPC_URL`, `TESTNET_RPC_URL`

## File Naming Conventions
- React components: PascalCase (`AccountHeader.tsx`)
- Utilities: camelCase (`cluster.ts`, `token-info.ts`)
- Client pages: `page-client.tsx` (with `'use client'`)
- Server pages: `page.tsx` (no directive)
- Tests: `*.spec.ts` or `*.test.ts` in `__tests__/` folders

## When Making Changes

### Adding Components
1. Use shadcn/ui when possible: `bun run gen`
2. Place shared components in `app/components/shared/`
3. Use `cn()` for className merging
4. Wrap client logic in `'use client'` components
5. Follow patterns in `docs/ui-system-spec.md` for consistency

### Adding Data Visualizations
1. Install required Nivo packages: `bun add @nivo/[chart-type]`
2. Use `ResponsiveXxx` components for automatic sizing
3. Wrap charts in shadcn/ui Card for consistent styling
4. Apply semantic color tokens for theme compatibility
5. Create reusable chart wrapper components when needed
6. See `docs/ui-system-spec.md` for complete examples

### Adding Features
1. Check if similar pattern exists (search for analogous features)
2. Follow provider pattern for data fetching
3. Add tests in adjacent `__tests__/` directory
4. Update `TABS_LOOKUP` if adding account detail pages

### Debugging
- Check browser console for client errors
- Check terminal for server errors
- Verify cluster connection status (top-right of UI)
- Use `npm run test` to validate changes before commit
