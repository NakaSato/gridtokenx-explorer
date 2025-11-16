# Environment Configuration Guide

This guide explains how to configure the GridTokenX Explorer for different environments.

## Quick Start

1. Copy `.env.local` to get started with local development
2. Update the GridTokenX program IDs after deploying your Anchor programs
3. Restart the Next.js dev server to pick up changes

```bash
bun dev
```

## Environment Variables

### RPC Endpoints

Configure the Solana RPC endpoints:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_SOLANA_RPC_HTTP` | HTTP RPC endpoint | `http://localhost:8899` |
| `NEXT_PUBLIC_SOLANA_RPC_WS` | WebSocket RPC endpoint | `ws://localhost:8900` |

**Local Development:**
```env
NEXT_PUBLIC_SOLANA_RPC_HTTP=http://localhost:8899
NEXT_PUBLIC_SOLANA_RPC_WS=ws://localhost:8900
```

**Devnet:**
```env
NEXT_PUBLIC_SOLANA_RPC_HTTP=https://api.devnet.solana.com
NEXT_PUBLIC_SOLANA_RPC_WS=wss://api.devnet.solana.com
```

**Custom RPC (e.g., Helius, Quicknode):**
```env
NEXT_PUBLIC_SOLANA_RPC_HTTP=https://your-rpc-provider.com/api-key
NEXT_PUBLIC_SOLANA_RPC_WS=wss://your-rpc-provider.com/api-key
```

### GridTokenX Program IDs

These are the deployed program addresses for your GridTokenX smart contracts:

| Variable | Program | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_REGISTRY_PROGRAM_ID` | Registry | Token registry and metadata management |
| `NEXT_PUBLIC_ORACLE_PROGRAM_ID` | Oracle | Price feeds and oracle data |
| `NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID` | Governance | DAO governance and voting |
| `NEXT_PUBLIC_TOKEN_PROGRAM_ID` | Token | Custom SPL token implementation |
| `NEXT_PUBLIC_TRADING_PROGRAM_ID` | Trading | DEX and trading functionality |

**How to get your program IDs:**

1. Deploy your Anchor programs:
   ```bash
   anchor build
   anchor deploy
   ```

2. Copy the program IDs from the deployment output or `target/deploy/` directory:
   ```bash
   solana address -k target/deploy/registry-keypair.json
   ```

3. Update `.env.local` with the new program IDs

4. Restart your dev server

### API Gateway

If you have a backend API gateway:

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8080
```

### Optional: Public Cluster RPC URLs

Override default public RPC endpoints (useful for rate limiting or premium RPC providers):

```env
NEXT_PUBLIC_MAINNET_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_DEVNET_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_TESTNET_RPC_URL=https://api.testnet.solana.com
```

### Optional: Token Metadata

Configure token metadata fetching behavior:

```env
# Comma-separated list of token addresses to redact/blacklist
NEXT_PUBLIC_BAD_TOKENS=TokenAddress1,TokenAddress2

# User agent for metadata requests
NEXT_PUBLIC_METADATA_USER_AGENT=GridTokenX Explorer

# Max content size in bytes (default: 10MB)
NEXT_PUBLIC_METADATA_MAX_CONTENT_SIZE=10485760

# Request timeout in milliseconds (default: 10s)
NEXT_PUBLIC_METADATA_TIMEOUT=10000
```

## Development Workflows

### Local Development with Validator

1. Start local Solana validator:
   ```bash
   solana-test-validator
   ```

2. Deploy programs:
   ```bash
   cd ../gridtokenx-blockchain  # Your Anchor workspace
   anchor build
   anchor deploy
   ```

3. Update `.env.local` with deployed program IDs

4. Start the explorer:
   ```bash
   bun dev
   ```

5. Open http://localhost:3000?cluster=custom

### Devnet Development

1. Configure Devnet RPC:
   ```env
   NEXT_PUBLIC_SOLANA_RPC_HTTP=https://api.devnet.solana.com
   NEXT_PUBLIC_SOLANA_RPC_WS=wss://api.devnet.solana.com
   ```

2. Deploy to Devnet:
   ```bash
   anchor deploy --provider.cluster devnet
   ```

3. Update program IDs in `.env.local`

4. Access: http://localhost:3000?cluster=devnet

### Production (Mainnet)

1. Use premium RPC provider (Helius, Quicknode, etc.)
2. Deploy programs to mainnet-beta
3. Set production environment variables in your hosting platform (Vercel, etc.)
4. **Never commit production keys or secrets to git**

## Troubleshooting

### "Cannot connect to RPC endpoint"

- Check if `solana-test-validator` is running
- Verify RPC URL in `.env.local`
- Check firewall/network settings

### "Program not found"

- Ensure programs are deployed to the correct cluster
- Verify program IDs match deployed addresses
- Check cluster selection in the UI (top right dropdown)

### Changes not reflected

- Restart Next.js dev server after changing `.env.local`
- Clear browser cache
- Check for typos in environment variable names

## Using Program IDs in Code

Import the utility helper:

```typescript
import { getGridTokenXProgramAddress, GRIDTOKENX_PROGRAM_IDS } from '@utils/program-ids';

// Get as Address type for @solana/kit
const registryAddress = getGridTokenXProgramAddress('registry');

// Get as string
const registryId = GRIDTOKENX_PROGRAM_IDS.registry;

// Check if configured
import { isGridTokenXProgramConfigured } from '@utils/program-ids';
if (isGridTokenXProgramConfigured('oracle')) {
  // Safe to use oracle program
}
```

## Security Notes

- ✅ `.env.local` is in `.gitignore` - safe for local secrets
- ❌ Never commit real private keys or API keys
- ✅ `NEXT_PUBLIC_*` variables are safe to expose to the browser
- ❌ Server-only secrets should NOT have `NEXT_PUBLIC_` prefix

## References

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Solana CLI](https://docs.solana.com/cli)
- [Anchor Framework](https://www.anchor-lang.com/)
