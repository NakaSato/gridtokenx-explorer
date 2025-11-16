# Blockchain Explorer Website Guide - Using @solana/kit

## Overview

This guide demonstrates how to build a blockchain explorer website for the GridTokenX platform using the `@solana/kit` library. The explorer enables users to view transactions, accounts, blocks, and program interactions on the Solana blockchain.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Setup & Installation](#setup--installation)
3. [Core Components](#core-components)
4. [API Endpoints](#api-endpoints)
5. [Frontend Implementation](#frontend-implementation)
6. [Real-time Updates](#real-time-updates)
7. [Advanced Features](#advanced-features)
8. [Performance Optimization](#performance-optimization)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Explorer Frontend                        │
│  (React/Next.js with @solana/kit integration)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├─── HTTP/REST ───┐
                   │                 │
                   └─── WebSocket ───┤
                                     │
┌────────────────────────────────────▼─────────────────────────┐
│              Explorer Backend Service                         │
│  - Account Queries    - Transaction History                  │
│  - Block Explorer     - Program Interactions                 │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ├─── RPC Client (@solana/kit)
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                  Solana RPC Node                             │
│  - Local Validator (Development)                            │
│  - Devnet/Testnet/Mainnet (Production)                      │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React/Next.js with TypeScript
- **Blockchain SDK**: `@solana/kit` v3.x
- **State Management**: React Query for caching
- **Real-time**: WebSocket subscriptions
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts for data visualization

---

## Setup & Installation

### 1. Install Dependencies

```bash
# Core dependencies
bun add @solana/kit @solana/web3.js

# Optional: Additional utilities
bun add @solana/spl-token @solana-program/address-lookup-table

# Frontend dependencies
bun add react-query recharts date-fns
bun add -D @types/node typescript
```

### 2. Environment Configuration

Create `.env.local`:

```bash
# RPC Endpoints
NEXT_PUBLIC_SOLANA_RPC_HTTP=http://localhost:8899
NEXT_PUBLIC_SOLANA_RPC_WS=ws://localhost:8900

# Network
NEXT_PUBLIC_SOLANA_NETWORK=localnet  # or devnet, testnet, mainnet-beta

# GridTokenX Program IDs (from Anchor.toml)
NEXT_PUBLIC_REGISTRY_PROGRAM_ID=Bxvy5YGhGXcqKCtBRHwmToT6mJ4ABEnAKALWiDcmvnN4
NEXT_PUBLIC_ORACLE_PROGRAM_ID=2Jqh9JgArbcvAfpwbsnMDz8MRxsyApmn2HvrvhGsyYcE
NEXT_PUBLIC_GOVERNANCE_PROGRAM_ID=9pKBrUtHxRyHfNmKu97fmFPzGvbfQBkBh3FqAP4YZ8xt
NEXT_PUBLIC_TOKEN_PROGRAM_ID=6zFCvqvvksQqpvGKj3nWDBD4YwYtqQCwFxJBLTyDHdYX
NEXT_PUBLIC_TRADING_PROGRAM_ID=BjqXpphKFJWrCu6Wuqt3NvnYETF9q8RGkCCfnL8sBtCR

# API Gateway
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8080
```

### 3. Initialize RPC Client

The project uses `app/utils/rpc.ts` which provides wrappers around `@solana/kit`:

```typescript
// app/utils/rpc.ts (already exists in the project)
import {
  createSolanaRpc,
  address as createAddress,
  Address,
  Commitment,
  signature as createSignature,
} from '@solana/kit';

/**
 * Create a Solana RPC client using @solana/kit
 */
export function createRpc(url: string) {
  return createSolanaRpc(url);
}

/**
 * Convert string to Address type from @solana/kit
 */
export function toAddress(addr: string | { toBase58(): string }): Address {
  if (typeof addr === 'string') {
    return createAddress(addr);
  }
  return createAddress(addr.toBase58());
}

/**
 * Convert string to Signature type from @solana/kit
 */
export function toSignature(sig: string): ReturnType<typeof createSignature> {
  return createSignature(sig);
}
```

**Usage in your components:**

```typescript
import { createRpc, toAddress } from '@utils/rpc';
import { useCluster } from '@providers/cluster';

// In a component or provider:
const { url } = useCluster();
const rpc = createRpc(url);
const accountAddress = toAddress('YourBase58AddressHere');
```

---

## Core Components

### 1. Account Viewer Component

Display detailed account information including balance, owner, and data.

```typescript
// app/components/account/AccountViewer.tsx
import { useEffect, useState } from 'react'
import { createRpc, toAddress } from '@utils/rpc'
import { useCluster } from '@providers/cluster'
import type { Account } from '@solana/kit'

interface AccountViewerProps {
  address: string
}

export function AccountViewer({ address: addressStr }: AccountViewerProps) {
  const { url } = useCluster()
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAccount() {
      try {
        setLoading(true)
        setError(null)
        
        const rpc = createRpc(url)
        const accountAddress = toAddress(addressStr)
        const accountData = await rpc.getAccountInfo(accountAddress).send()
        
        setAccount(accountData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load account')
      } finally {
        setLoading(false)
      }
    }

    if (addressStr && url) {
      loadAccount()
    }
  }, [addressStr, url])

  if (loading) {
    return <div className="animate-pulse">Loading account...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  if (!account) {
    return <div className="text-yellow-500">Account does not exist</div>
  }

  // Calculate SOL balance
  const solBalance = Number(account.value?.lamports ?? 0n) / 1_000_000_000

  return (
    <div className="space-y-4 bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold">Account Details</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-400">Address</p>
          <p className="font-mono text-sm break-all">{addressStr}</p>
        </div>
        
        <div>
          <p className="text-gray-400">Balance</p>
          <p className="text-xl font-bold">{solBalance.toFixed(9)} SOL</p>
        </div>
        
        <div>
          <p className="text-gray-400">Owner Program</p>
          <p className="font-mono text-sm">{account.value?.owner}</p>
        </div>
        
        <div>
          <p className="text-gray-400">Executable</p>
          <p>{account.value?.executable ? 'Yes' : 'No'}</p>
        </div>
        
        <div className="col-span-2">
          <p className="text-gray-400">Data Size</p>
          <p>{account.value?.data ? account.value.data.length : 0} bytes</p>
        </div>
      </div>
      
      {account.value?.data && account.value.data.length > 0 && (
        <div>
          <p className="text-gray-400 mb-2">Account Data (base64)</p>
          <pre className="bg-gray-900 p-4 rounded overflow-x-auto text-xs">
            {account.value.data.toString()}
          </pre>
        </div>
      )}
    </div>
  )
}
```

### 2. Transaction Inspector Component

Display transaction details with instruction parsing.

```typescript
// app/components/transaction/TransactionInspector.tsx
import { useEffect, useState } from 'react'
import { createRpc, toSignature } from '@utils/rpc'
import { useCluster } from '@providers/cluster'

interface TransactionInspectorProps {
  signature: string
}

interface TransactionInfo {
  slot: bigint
  blockTime: bigint | null
  fee: bigint
  success: boolean
  logs: string[]
  instructions: any[]
}

export function TransactionInspector({ signature }: TransactionInspectorProps) {
  const { url } = useCluster()
  const [txInfo, setTxInfo] = useState<TransactionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTransaction() {
      try {
        setLoading(true)
        setError(null)

        const rpc = createRpc(url)
        const sig = toSignature(signature)
        const response = await rpc
          .getTransaction(sig, {
            maxSupportedTransactionVersion: 0,
            encoding: 'jsonParsed',
          })
          .send()

        if (!response) {
          throw new Error('Transaction not found')
        }

        setTxInfo({
          slot: response.slot,
          blockTime: response.blockTime,
          fee: response.meta?.fee ?? 0n,
          success: response.meta?.err === null,
          logs: response.meta?.logMessages ?? [],
          instructions: response.transaction.message.instructions,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transaction')
      } finally {
        setLoading(false)
      }
    }

    if (signature) {
      loadTransaction()
    }
  }, [signature])

  if (loading) {
    return <div className="animate-pulse">Loading transaction...</div>
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  if (!txInfo) {
    return <div className="text-yellow-500">Transaction not found</div>
  }

  return (
    <div className="space-y-6 bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold">Transaction Details</h2>

      {/* Status Banner */}
      <div
        className={`p-4 rounded ${
          txInfo.success
            ? 'bg-green-900/20 border border-green-500'
            : 'bg-red-900/20 border border-red-500'
        }`}
      >
        <p className="font-bold">
          Status: {txInfo.success ? '✅ Success' : '❌ Failed'}
        </p>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-400">Signature</p>
          <p className="font-mono text-sm break-all">{signature}</p>
        </div>

        <div>
          <p className="text-gray-400">Slot</p>
          <p className="text-xl">{txInfo.slot.toString()}</p>
        </div>

        <div>
          <p className="text-gray-400">Block Time</p>
          <p>
            {txInfo.blockTime
              ? new Date(Number(txInfo.blockTime) * 1000).toLocaleString()
              : 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-gray-400">Fee</p>
          <p>{Number(txInfo.fee) / 1_000_000_000} SOL</p>
        </div>
      </div>

      {/* Instructions */}
      <div>
        <h3 className="text-xl font-bold mb-3">
          Instructions ({txInfo.instructions.length})
        </h3>
        <div className="space-y-2">
          {txInfo.instructions.map((ix: any, idx: number) => (
            <div key={idx} className="bg-gray-900 p-4 rounded">
              <p className="font-mono text-sm text-gray-400">
                Instruction #{idx + 1}
              </p>
              <p className="font-mono text-xs mt-2">
                Program: {ix.programId || ix.program || 'Unknown'}
              </p>
              <pre className="mt-2 text-xs overflow-x-auto">
                {JSON.stringify(ix, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Logs */}
      {txInfo.logs.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-3">Transaction Logs</h3>
          <pre className="bg-gray-900 p-4 rounded overflow-x-auto text-xs">
            {txInfo.logs.join('\n')}
          </pre>
        </div>
      )}

      {/* Explorer Links */}
      <div className="border-t border-gray-700 pt-4">
        <p className="text-gray-400 mb-2">View in External Explorers:</p>
        <div className="flex gap-2">
          <a
            href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Solana Explorer
          </a>
          <a
            href={`https://solscan.io/tx/${signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Solscan
          </a>
        </div>
      </div>
    </div>
  )
}
```

### 3. Multiple Accounts Viewer

Efficiently fetch and display multiple accounts using batch requests.

```typescript
// app/components/account/MultiAccountViewer.tsx
import { useEffect, useState } from 'react'
import { createRpc, toAddress } from '@utils/rpc'
import { useCluster } from '@providers/cluster'
import type { Account } from '@solana/kit'

interface MultiAccountViewerProps {
  addresses: string[]
}

export function MultiAccountViewer({ addresses }: MultiAccountViewerProps) {
  const { url } = useCluster()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAccounts() {
      try {
        setLoading(true)
        
        const rpc = createRpc(url)
        // Convert strings to Address types
        const addressObjects = addresses.map(toAddress)
        
        // Batch fetch all accounts in a single RPC call
        const fetchedAccounts = await rpc.getMultipleAccounts(addressObjects).send()
        
        setAccounts(fetchedAccounts.value)
      } catch (err) {
        console.error('Failed to load accounts:', err)
      } finally {
        setLoading(false)
      }
    }

    if (addresses.length > 0 && url) {
      loadAccounts()
    }
  }, [addresses, url])

  if (loading) {
    return <div className="animate-pulse">Loading accounts...</div>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">
        Multiple Accounts ({accounts.length})
      </h2>
      
      <div className="grid gap-4">
        {accounts.map((account, idx) => {
          const address = addresses[idx]
          const exists = account !== null
          const solBalance = exists && account?.lamports
            ? Number(account.lamports) / 1_000_000_000
            : 0

          return (
            <div
              key={address}
              className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-mono text-sm text-gray-400">{address}</p>
                <p className={exists ? 'text-green-400' : 'text-red-400'}>
                  {exists ? 'Exists' : 'Does not exist'}
                </p>
              </div>
              
              {exists && account && (
                <div className="text-right">
                  <p className="text-xl font-bold">{solBalance.toFixed(4)} SOL</p>
                  <p className="text-xs text-gray-400">
                    {account.data?.length ?? 0} bytes
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

---

## API Endpoints

### GraphQL API Integration

The `@solana/kit` library supports GraphQL for more efficient queries.

```typescript
// app/utils/graphql-rpc.ts
import { createSolanaRpcGraphQL } from '@solana/rpc-graphql'
import { createRpc } from '@utils/rpc'
import { useCluster } from '@providers/cluster'

// Create GraphQL RPC instance dynamically based on cluster
export function createGraphQLRpc(url: string) {
  const rpc = createRpc(url)
  return createSolanaRpcGraphQL(rpc)
}

// Example: Query account with mint details
export async function queryTokenAccount(address: string) {
  const source = `
    query TokenAccountQuery($address: String!) {
      account(address: $address) {
        address
        lamports
        ... on TokenAccount {
          mint {
            ... on MintAccount {
              address
              decimals
              supply
              mintAuthority {
                address
              }
            }
          }
          owner {
            address
            lamports
          }
          state
          isNative
        }
      }
    }
  `

  const result = await rpcGraphQL.query(source, { address })
  return result
}

// Example: Query transaction with nested instruction data
export async function queryTransactionDetails(signature: string) {
  const source = `
    query TransactionQuery($signature: String!, $commitment: Commitment) {
      transaction(signature: $signature, commitment: $commitment) {
        blockTime
        slot
        meta {
          fee
          err
          logMessages
        }
        message {
          instructions {
            ... on SplTokenTransferInstruction {
              amount
              authority {
                address
              }
              destination {
                address
              }
              source {
                address
              }
            }
            ... on CreateAccountInstruction {
              lamports
              space
              programId
            }
          }
        }
      }
    }
  `

  const result = await rpcGraphQL.query(source, {
    signature,
    commitment: 'confirmed',
  })
  
  return result
}
```

---

## Real-time Updates

### Account Change Subscriptions

Monitor account changes in real-time using WebSocket subscriptions.

```typescript
// app/hooks/useAccountSubscription.ts (create this file)
import { useEffect, useState } from 'react'
import { toAddress } from '@utils/rpc'
import { useCluster } from '@providers/cluster'
import { createSolanaRpcSubscriptions } from '@solana/kit'
import type { Address } from '@solana/kit'

export function useAccountSubscription(addressStr: string) {
  const { url } = useCluster()
  const [lamports, setLamports] = useState<bigint | null>(null)
  const [updateCount, setUpdateCount] = useState(0)

  useEffect(() => {
    if (!addressStr || !url) return

    const accountAddress: Address = toAddress(addressStr)
    const abortController = new AbortController()
    const rpcSubscriptions = createSolanaRpcSubscriptions(url.replace('http', 'ws'))

    async function subscribe() {
      try {
        // Subscribe to account changes
        const notifications = await rpcSubscriptions
          .accountNotifications(accountAddress, { commitment: 'confirmed' })
          .subscribe({ abortSignal: abortController.signal })

        // Process notifications as they arrive
        for await (const notification of notifications) {
          console.log('Account updated:', notification.value)
          setLamports(notification.value.lamports)
          setUpdateCount((prev) => prev + 1)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Subscription cancelled')
        } else {
          console.error('Subscription error:', error)
        }
      }
    }

    subscribe()

    // Cleanup: cancel subscription on unmount
    return () => {
      abortController.abort()
    }
  }, [addressStr])

  return {
    lamports,
    updateCount,
    solBalance: lamports ? Number(lamports) / 1_000_000_000 : null,
  }
}
```

### Slot Notifications

Subscribe to new slots for blockchain progress monitoring.

```typescript
// app/hooks/useSlotSubscription.ts (create this file)
import { useEffect, useState } from 'react'
import { useCluster } from '@providers/cluster'
import { createSolanaRpcSubscriptions } from '@solana/kit'

export function useSlotSubscription() {
  const { url } = useCluster()
  const [currentSlot, setCurrentSlot] = useState<bigint | null>(null)
  const [slotHistory, setSlotHistory] = useState<bigint[]>([])

  useEffect(() => {
    if (!url) return
    
    const abortController = new AbortController()
    const rpcSubscriptions = createSolanaRpcSubscriptions(url.replace('http', 'ws'))

    async function subscribe() {
      try {
        const slotNotifications = await rpcSubscriptions
          .slotNotifications()
          .subscribe({ abortSignal: abortController.signal })

        for await (const slot of slotNotifications) {
          setCurrentSlot(BigInt(slot.slot))
          setSlotHistory((prev) => [...prev.slice(-99), BigInt(slot.slot)])
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Slot subscription error:', error)
        }
      }
    }

    subscribe()

    return () => {
      abortController.abort()
    }
  }, [])

  return { currentSlot, slotHistory }
}
```

### Program Account Monitoring

Monitor all accounts owned by a specific program (e.g., Trading Program).

```typescript
// app/hooks/useProgramAccounts.ts (create this file)
import { useEffect, useState } from 'react'
import { createRpc, toAddress } from '@utils/rpc'
import { useCluster } from '@providers/cluster'
import type { Address } from '@solana/kit'

export function useProgramAccounts(programIdStr: string) {
  const { url } = useCluster()
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProgramAccounts() {
      try {
        setLoading(true)
        
        const rpc = createRpc(url)
        const programAddress = toAddress(programIdStr)
        
        // Get all accounts owned by this program
        const accountInfos = await rpc
          .getProgramAccounts(programAddress, {
            encoding: 'base64',
          })
          .send()

        setAccounts(accountInfos)
      } catch (err) {
        console.error('Failed to load program accounts:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProgramAccounts()
  }, [programId])

  return { accounts, loading }
}
```

---

## Advanced Features

### 1. Transaction History Viewer

Display paginated transaction history for an account.

```typescript
// app/utils/transaction-history.ts (create this file)
import { createRpc, toAddress, toSignature } from '@utils/rpc'
import type { Address } from '@solana/kit'

export interface TransactionHistoryOptions {
  limit?: number
  before?: string
  until?: string
}

export async function getTransactionHistory(
  rpcUrl: string,
  addressStr: string,
  options: TransactionHistoryOptions = {}
) {
  const rpc = createRpc(rpcUrl)
  const address: Address = toAddress(addressStr)
  
  const signatures = await rpc
    .getSignaturesForAddress(address, {
      limit: options.limit || 10,
      before: options.before ? toSignature(options.before) : undefined,
      until: options.until ? toSignature(options.until) : undefined,
    })
    .send()

  // Fetch full transaction details
  const transactions = await Promise.all(
    signatures.map(async (sig) => {
      const tx = await rpc
        .getTransaction(toSignature(sig.signature), {
          maxSupportedTransactionVersion: 0,
          encoding: 'jsonParsed',
        })
        .send()
      
      return {
        signature: sig.signature,
        blockTime: sig.blockTime,
        slot: sig.slot,
        err: sig.err,
        transaction: tx,
      }
    })
  )

  return transactions
}
```

### 2. Token Account Parser

Parse SPL token accounts with full mint information.

```typescript
// app/utils/token-parser.ts (create this file)
import { createRpc, toAddress } from '@utils/rpc'
import type { Address } from '@solana/kit'

export interface TokenAccountData {
  mint: Address
  owner: Address
  amount: bigint
  decimals: number
  displayAmount: string
}

export async function parseTokenAccount(
  rpcUrl: string,
  addressStr: string
): Promise<TokenAccountData | null> {
  try {
    const rpc = createRpc(rpcUrl)
    const address = toAddress(addressStr)
    
    // Fetch with JSON parsing
    const account = await rpc
      .getAccountInfo(address, { encoding: 'jsonParsed' })
      .send()

    if (!account.value) {
      return null
    }

    const parsed = account.value.data as any
    const { mint, owner, tokenAmount } = parsed.parsed.info
    
    return {
      mint,
      owner,
      amount: BigInt(tokenAmount.amount),
      decimals: tokenAmount.decimals,
      displayAmount: tokenAmount.uiAmount.toString(),
    }
  } catch (error) {
    console.error('Failed to parse token account:', error)
    return null
  }
}
```

### 3. Address Lookup Table Support

Compress transactions using address lookup tables for lower fees.

```typescript
// app/utils/address-lookup-table.ts (create this file)
import { createRpc, toAddress } from '@utils/rpc'
import {
  compressTransactionMessageUsingAddressLookupTables,
  type AddressesByLookupTableAddress,
  type TransactionMessage,
} from '@solana/kit'
import { fetchAddressLookupTable } from '@solana-program/address-lookup-table'

export async function compressTransactionWithLookupTable(
  rpcUrl: string,
  transactionMessage: TransactionMessage,
  lookupTableAddress: string
) {
  const rpc = createRpc(rpcUrl)
  const lookupAddress = toAddress(lookupTableAddress)
  
  // Fetch the lookup table
  const { data: { addresses } } = await fetchAddressLookupTable(
    rpc,
    lookupAddress
  )

  // Create lookup table mapping
  const addressesByLookupTable: AddressesByLookupTableAddress = {
    [lookupTableAddress]: addresses,
  }

  // Compress the transaction
  const compressedMessage = compressTransactionMessageUsingAddressLookupTables(
    transactionMessage,
    addressesByLookupTable
  )

  return compressedMessage
}
```

---

## Performance Optimization

### 1. Request Coalescing

The `@solana/kit` library automatically coalesces duplicate requests.

```typescript
// Multiple calls to the same account are deduplicated
const rpc = createRpc(url)
const addr = toAddress('ABC...')
const [account1, account2, account3] = await Promise.all([
  rpc.getAccountInfo(addr).send(),  // Makes RPC call
  rpc.getAccountInfo(addr).send(),  // May use cached result depending on RPC
  rpc.getAccountInfo(addr).send(),  // May use cached result depending on RPC
])
```

### 2. GraphQL Query Batching

Use GraphQL to batch multiple account queries into a single RPC call.

```typescript
// app/utils/batched-queries.ts (create this file)
import { createGraphQLRpc } from '@utils/graphql-rpc'

export async function batchFetchAccounts(rpcUrl: string, addresses: string[]) {
  const rpcGraphQL = createGraphQLRpc(rpcUrl)
  // GraphQL automatically batches into getMultipleAccounts
  const promises = addresses.map((address) =>
    rpcGraphQL.query(
      `
      query ($address: String!) {
        account(address: $address) {
          lamports
          data(encoding: BASE_64)
        }
      }
    `,
      { address }
    )
  )

  return Promise.all(promises)
}
```

### 3. React Query Integration

Cache RPC responses and manage loading states efficiently.

```typescript
// app/hooks/useAccount.ts (create this file)
import { useQuery } from '@tanstack/react-query'
import { createRpc, toAddress } from '@utils/rpc'
import { useCluster } from '@providers/cluster'

export function useAccount(addressStr: string) {
  const { url } = useCluster()
  
  return useQuery({
    queryKey: ['account', addressStr, url],
    queryFn: async () => {
      const rpc = createRpc(url)
      const address = toAddress(addressStr)
      return rpc.getAccountInfo(address).send()
    },
    enabled: Boolean(addressStr),
    staleTime: 30_000, // Cache for 30 seconds
    refetchInterval: 60_000, // Refetch every minute
  })
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Account not found" Errors

**Cause**: Account doesn't exist on the blockchain yet.

**Solution**:
```typescript
const rpc = createRpc(url)
const addr = toAddress(addressStr)
const accountInfo = await rpc.getAccountInfo(addr).send()

if (!accountInfo.value) {
  console.log('Account does not exist')
  // Handle non-existent account
} else {
  // Process account data
  console.log('Balance:', accountInfo.value.lamports)
}
```

#### 2. WebSocket Connection Drops

**Cause**: Network issues or validator restart.

**Solution**: Implement automatic reconnection:
```typescript
import { createSolanaRpcSubscriptions } from '@solana/kit'

async function subscribeWithRetry(
  wsUrl: string,
  address: Address,
  maxRetries = 3
) {
  let retries = 0
  
  while (retries < maxRetries) {
    try {
      const rpcSubscriptions = createSolanaRpcSubscriptions(wsUrl)
      const notifications = await rpcSubscriptions
        .accountNotifications(address, { commitment: 'confirmed' })
        .subscribe({ abortSignal: AbortSignal.timeout(300_000) })
      
      for await (const notification of notifications) {
        // Process notification
      }
      
      break // Success
    } catch (error) {
      retries++
      console.log(`Retry ${retries}/${maxRetries}`)
      await new Promise(resolve => setTimeout(resolve, 1000 * retries))
    }
  }
}
```

#### 3. Transaction Signature Not Found

**Cause**: Transaction not yet confirmed or doesn't exist.

**Solution**: Poll with exponential backoff:
```typescript
import { createRpc, toSignature } from '@utils/rpc'

async function waitForTransaction(
  rpcUrl: string,
  signatureStr: string,
  maxAttempts = 30
) {
  const rpc = createRpc(rpcUrl)
  const signature = toSignature(signatureStr)
  
  for (let i = 0; i < maxAttempts; i++) {
    const tx = await rpc
      .getTransaction(signature, { maxSupportedTransactionVersion: 0 })
      .send()
    
    if (tx) {
      return tx
    }
    
    // Wait before retry (exponential backoff)
    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
  }
  
  throw new Error('Transaction not found after maximum attempts')
}
```

#### 4. Rate Limiting

**Cause**: Too many RPC requests.

**Solutions**:
- Use GraphQL batching
- Implement request throttling
- Use caching (React Query)
- Consider premium RPC providers (mainnet)

```typescript
// Throttle example
import pThrottle from 'p-throttle'

const throttle = pThrottle({
  limit: 10,    // 10 requests
  interval: 1000 // per second
})

const throttledFetch = throttle(async (rpcUrl: string, address: string) => {
  const rpc = createRpc(rpcUrl)
  return rpc.getAccountInfo(toAddress(address)).send()
})
```

---

## Example: Complete Explorer Dashboard

```typescript
// app/explorer/page.tsx (create this directory and file)
'use client'
import { useState } from 'react'
import { AccountViewer } from '@components/account/AccountViewer'
import { TransactionInspector } from '@components/transaction/TransactionInspector'
import { useSlotSubscription } from '@/hooks/useSlotSubscription'

export default function ExplorerDashboard() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'account' | 'transaction'>('account')
  const { currentSlot } = useSlotSubscription()

  const handleSearch = () => {
    // Implement search logic
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">GridTokenX Explorer</h1>
          <div className="text-right">
            <p className="text-gray-400">Current Slot</p>
            <p className="text-2xl font-mono">
              {currentSlot?.toString() || 'Loading...'}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex gap-4">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="bg-gray-700 px-4 py-2 rounded"
            >
              <option value="account">Account</option>
              <option value="transaction">Transaction</option>
            </select>
            
            <input
              type="text"
              placeholder={`Enter ${searchType} address...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-gray-700 px-4 py-2 rounded"
            />
            
            <button
              onClick={handleSearch}
              className="bg-blue-600 px-6 py-2 rounded hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        {searchQuery && (
          <div>
            {searchType === 'account' ? (
              <AccountViewer address={searchQuery} />
            ) : (
              <TransactionInspector signature={searchQuery} />
            )}
          </div>
        )}

        {/* Program Links - Configure these with your actual program IDs */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { name: 'Token', id: process.env.NEXT_PUBLIC_TOKEN_PROGRAM_ID },
            { name: 'System', id: '11111111111111111111111111111111' },
            // Add your GridTokenX program IDs here
          ].filter(p => p.id).map(({ name, id }) => (
            <button
              key={name}
              onClick={() => {
                setSearchType('account')
                setSearchQuery(id!)
              }}
              className="bg-gray-800 p-4 rounded hover:bg-gray-700"
            >
              <p className="font-bold capitalize">{name}</p>
              <p className="text-xs text-gray-400 font-mono truncate">{id}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---

## Additional Resources

### Official Documentation
- [@solana/kit Documentation](https://github.com/anza-xyz/kit)
- [Solana JSON RPC API](https://docs.solana.com/api)
- [GraphQL for Solana RPC](https://github.com/anza-xyz/kit/tree/main/packages/rpc-graphql)

### GridTokenX Specific
- [Blockchain Architecture](./architecture/blockchain/README.md)
- [API Gateway Integration](./API_GATEWAY_BLOCKCHAIN_INTERACTION.md)
- [Testing Guide](../blockchain/BLOCKCHAIN_TESTING.md)

### Tools
- [Solana Explorer](https://explorer.solana.com/)
- [Solscan](https://solscan.io/)
- [Anchor Framework](https://www.anchor-lang.com/)

---

## Next Steps

1. **Implement Advanced Filtering**: Add filters for transaction type, time range, and program ID
2. **Add Analytics Dashboard**: Create charts showing transaction volume, account growth, and program usage
3. **Program-Specific Views**: Build custom viewers for each GridTokenX program (Registry, Trading, etc.)
4. **Export Functionality**: Allow users to export transaction data as CSV/JSON
5. **Mobile Responsiveness**: Optimize UI for mobile devices
6. **Performance Monitoring**: Integrate metrics for RPC latency and error rates

---

**Document Version**: 1.0  
**Last Updated**: November 16, 2025  
**Maintainer**: Engineering Team
