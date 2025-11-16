# Quick Start: Migrating to @solana/kit

## TL;DR

**Goal:** Replace `@solana/web3.js` v1 with `@solana/kit` (web3.js 2.0)  
**Status:** 15% complete - Core providers migrated  
**Timeline:** 4-6 weeks for full migration  
**Strategy:** Gradual migration with adapter layer for third-party libs

## Quick Decision Tree

### "Should I use kit or v1?"

```
Is this NEW code?
├─ YES → Use @solana/kit (createRpc() from @utils/rpc.ts)
└─ NO → Migrating existing code?
    ├─ Does it use Anchor/Serum/Mango/Metaplex?
    │   └─ YES → Keep v1, use adapter pattern
    └─ Is it a simple RPC call?
        ├─ YES → Migrate to kit
        └─ NO → Complex parsing/types?
            ├─ YES → Keep v1 for now
            └─ NO → Migrate to kit

```

## Common Migration Patterns

### 1. Simple RPC Calls (MIGRATE)

```typescript
// ❌ Before (v1)
import { Connection } from '@solana/web3.js';
const connection = new Connection(url);
const balance = await connection.getBalance(pubkey);

// ✅ After (kit)
import { createRpc, toAddress } from '@utils/rpc';
const rpc = createRpc(url);
const balance = await rpc.getBalance(toAddress(pubkey)).send();
const balanceNumber = Number(balance); // kit returns bigint
```

### 2. Type-Only Imports (MIGRATE)

```typescript
// ❌ Before
import { PublicKey } from '@solana/web3.js';
function MyComponent({ address }: { address: PublicKey }) { }

// ✅ After
import { Address } from '@solana/kit';
function MyComponent({ address }: { address: Address | string }) {
  // Use toAddress() helper if you need Address type
}
```

### 3. Parsed Transactions (KEEP V1 FOR NOW)

```typescript
// ⚠️ Keep v1 - complex type structure
import { Connection, ParsedTransactionWithMeta } from '@solana/web3.js';
const connection = new Connection(url);
const tx = await connection.getParsedTransaction(signature, {
  commitment: 'confirmed',
  maxSupportedTransactionVersion: 0,
});
// TODO: Migrate when type converters ready (Phase 2)
```

### 4. Third-Party Libraries (USE ADAPTER)

```typescript
// ⚠️ Use adapter pattern
import { LegacyAdapter } from '@utils/legacy-adapters'; // TODO: Create this
import { toAddress } from '@utils/rpc';

// When you need Anchor/Serum/etc
const adapter = new LegacyAdapter(rpcUrl);
const program = await adapter.getAnchorProgram(
  toAddress(programId), 
  idl
);
```

## File-by-File Quick Status

### ✅ Already Migrated (Use as reference)
- `app/providers/cluster.tsx` - Cluster connection management
- `app/providers/epoch.tsx` - Epoch data fetching
- `app/providers/richList.tsx` - Top accounts
- `app/providers/block.tsx` - Block data
- `app/utils/rpc.ts` - Helper utilities

### 🚧 Next to Migrate (Phase 2-3)
- `app/providers/transactions/parsed.tsx` - Transaction details
- `app/providers/accounts/history.tsx` - Account history
- `app/providers/accounts/tokens.tsx` - Token accounts
- `app/components/block/*.tsx` - Block components

### ⏸️ Keep v1 (Ecosystem dependencies)
- `app/api/anchor/route.ts` - Anchor programs
- `app/components/instruction/serum/*` - Serum markets
- `app/components/instruction/mango/*` - Mango markets
- `app/utils/name-service.tsx` - SNS integration
- `app/utils/verified-builds.tsx` - Complex parsing

## Essential Helpers (in `@utils/rpc.ts`)

```typescript
// RPC Client Creation
createRpc(url: string) → Rpc

// Type Converters
toAddress(string | PublicKey) → Address
publicKeyToAddress(PublicKey) → Address
addressToPublicKey(Address) → PublicKey
bigintToNumber(bigint) → number

// Legacy Compatibility
createLegacyConnection(url, commitment?) → Connection
```

## Testing Your Migration

```bash
# Run tests
bun test

# Check for type errors
bun run build

# Dev server (check for runtime errors)
bun dev
```

## Common Errors & Fixes

### Error: "Cannot find module '@solana/kit'"
**Fix:** Already installed, check imports

### Error: "Type 'Address' is not assignable to type 'PublicKey'"
**Fix:** Use `addressToPublicKey()` converter

### Error: "Type 'bigint' is not assignable to type 'number'"
**Fix:** Use `bigintToNumber()` or `Number()` conversion

### Error: "connection.getParsedTransaction is not a function"
**Fix:** You're using kit's rpc, either use v1 Connection or wait for converter

## Performance Benefits

### Before (v1)
- Larger bundle size
- Callback-based APIs
- Less type-safe

### After (kit)
- ~30% smaller bundle
- Modern async/await
- Better TypeScript inference
- Faster RPC calls

## Need Help?

1. **Check examples:** Look at migrated files (cluster.tsx, epoch.tsx)
2. **Read full plan:** `docs/SOLANA_KIT_MIGRATION_PLAN.md`
3. **Check type conversions:** `app/utils/rpc.ts`
4. **When in doubt:** Keep v1, use adapter pattern

## Key Principles

1. **New code = kit** - Always start with kit for new features
2. **Simple migrations first** - RPC calls, type-only imports
3. **Complex later** - Parsed transactions, third-party libs
4. **Test everything** - Unit tests + integration tests
5. **Keep adapters** - Don't break third-party integrations

---

**Full Details:** See `docs/SOLANA_KIT_MIGRATION_PLAN.md`
