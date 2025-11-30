"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Copy, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/app/(shared)/components/ui/button"
import Link from "next/link"
import { useCluster } from "@/app/(core)/providers/cluster"
import { Connection } from "@solana/web3.js"

interface Block {
  number: number
  time: string
  size: number
  validator: string
  validatorColor: string
  txn: number
  gasUsed: number
  gasPercentage: number
  gasChange: number
  reward: string
}

const PAGE_SIZE = 10
const REFRESH_INTERVAL = 10000 // 10 seconds

export function BlocksTable() {
  const { cluster, url } = useCluster()
  const [blocks, setBlocks] = useState<Block[]>([])
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "forked" | "uncles">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isScanning, setIsScanning] = useState(true)
  const [networkUtilization] = useState(1.51) // Placeholder for now
  const [latestSlot, setLatestSlot] = useState<number | null>(null)
  const connectionRef = useRef<Connection | null>(null)

  // Initialize connection
  useEffect(() => {
    connectionRef.current = new Connection(url, "confirmed")
  }, [url])

  const fetchBlockBatch = useCallback(async (startSlot: number, count: number) => {
    if (!connectionRef.current) return []

    const slots = Array.from({ length: count }, (_, i) => startSlot - i)
    const blocksData: Block[] = []

    // Batch requests to avoid rate limits
    const BATCH_SIZE = 5
    for (let i = 0; i < slots.length; i += BATCH_SIZE) {
      const batchSlots = slots.slice(i, i + BATCH_SIZE)
      try {
        const results = await Promise.all(
          batchSlots.map(async (slot) => {
            try {
              // Add delay between individual requests in a batch to be gentle
              await new Promise(resolve => setTimeout(resolve, 50 * (slot % 5)))
              return await connectionRef.current!.getBlock(slot, {
                maxSupportedTransactionVersion: 0,
                rewards: true,
              })
            } catch (err: any) {
              const errorMessage = err.message || JSON.stringify(err)
              if (errorMessage.includes("Block not available")) {
                // Block skipped or not yet available, ignore
                return null
              }
              if (errorMessage.includes("403") || errorMessage.includes("Access forbidden")) {
                console.warn(`RPC Access Forbidden (403) for block ${slot}. Pausing scan.`)
                setIsScanning(false)
                return null
              }
              console.error(`Failed to fetch block ${slot}:`, err)
              return null
            }
          })
        )

        for (let j = 0; j < results.length; j++) {
          const block = results[j]
          const slot = batchSlots[j]

          if (block) {
            // Generate deterministic color based on validator address
            const validator = block.rewards?.[0]?.pubkey || "Unknown"
            const colors = [
              "from-cyan-400 to-blue-500",
              "from-orange-400 to-pink-500",
              "from-green-400 to-cyan-500",
              "from-purple-400 to-pink-500",
              "from-yellow-400 to-orange-500",
            ]
            const colorIndex = validator.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length

            // Calculate "gas" metrics (compute units)
            // This is an approximation as Solana uses Compute Units, not Gas
            const computeUnitsConsumed = block.transactions.reduce((acc, tx) => {
               return acc + (tx.meta?.computeUnitsConsumed || 0)
            }, 0)
            
            // Max compute units per block is 48M
            const MAX_COMPUTE_UNITS = 48_000_000
            const utilization = (computeUnitsConsumed / MAX_COMPUTE_UNITS) * 100

            blocksData.push({
              number: slot,
              time: getTimeAgo(block.blockTime),
              size: JSON.stringify(block).length, // Rough estimate
              validator: validator,
              validatorColor: colors[colorIndex],
              txn: block.transactions.length,
              gasUsed: computeUnitsConsumed,
              gasPercentage: Number(utilization.toFixed(2)),
              gasChange: 0, // Need previous block to calculate
              reward: (block.rewards?.reduce((acc, r) => acc + r.lamports, 0) || 0) / 1e9 + " SOL",
            })
          }
        }
        
        // Add delay between batches
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        console.error("Error fetching batch:", error)
      }
    }

    return blocksData
  }, [])

  // Initial fetch
  useEffect(() => {
    const initialFetch = async () => {
      if (!connectionRef.current) return
      try {
        setIsScanning(true)
        const slot = await connectionRef.current.getSlot()
        setLatestSlot(slot)
        const startSlot = slot - (currentPage - 1) * PAGE_SIZE
        const newBlocks = await fetchBlockBatch(startSlot, PAGE_SIZE)
        setBlocks(newBlocks)
      } catch (error) {
        console.error("Error fetching initial blocks:", error)
      } finally {
        setIsScanning(false)
      }
    }

    initialFetch()
  }, [currentPage, fetchBlockBatch, url])

  // Keep track of latestSlot in a ref to avoid re-subscribing
  const latestSlotRef = useRef<number | null>(null)

  // Sync ref with state
  useEffect(() => {
    latestSlotRef.current = latestSlot
  }, [latestSlot])

  // Live updates subscription
  useEffect(() => {
    if (!connectionRef.current || currentPage !== 1) return

    const subscribe = async () => {
      try {
        if (!connectionRef.current) return

        const subscriptionId = connectionRef.current.onSlotChange(async (slotInfo) => {
          const newSlot = slotInfo.slot
          const currentLatestSlot = latestSlotRef.current
          
          // Only fetch if we have a latest slot and the new slot is newer
          if (currentLatestSlot && newSlot > currentLatestSlot) {
            setLatestSlot(newSlot)
            
            // Fetch only the new block(s)
            const newBlocksData = await fetchBlockBatch(newSlot, 1)
            
            if (newBlocksData.length > 0) {
              setBlocks(prevBlocks => {
                // Prepend new blocks and keep only PAGE_SIZE
                const updated = [...newBlocksData, ...prevBlocks]
                return updated.slice(0, PAGE_SIZE)
              })
            }
          }
        })

        return () => {
          if (connectionRef.current) {
            connectionRef.current.removeSlotChangeListener(subscriptionId)
          }
        }
      } catch (error) {
        console.error("WebSocket subscription error:", error)
      }
    }

    const cleanupPromise = subscribe()

    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup())
    }
  }, [currentPage, fetchBlockBatch])

  const getTimeAgo = (timestamp: number | null | undefined) => {
    if (!timestamp) return "Unknown"
    const diff = Math.floor(Date.now() / 1000) - timestamp
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  const tabs = [
    { id: "all" as const, label: "All" },
    { id: "forked" as const, label: "Forked" },
    { id: "uncles" as const, label: "Uncles" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Blocks</h1>
      </div>

      {/* Tabs and Pagination */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
          <span className="text-xs md:text-sm text-muted-foreground">
            Network utilization:{" "}
            <span className="text-green-400 font-mono">{networkUtilization}%</span>
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="text-xs md:text-sm text-muted-foreground border-border/50 hover:border-cyan-500/30 bg-transparent h-8"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || isScanning}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 border-border/50 hover:border-cyan-500/30 bg-transparent"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isScanning}
            >
              <ChevronLeft className="w-3 md:w-4 h-3 md:h-4" />
            </Button>
            <div className="w-8 h-8 flex items-center justify-center bg-secondary rounded-md border border-border/50">
              <span className="text-xs md:text-sm font-medium">{currentPage}</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 border-border/50 hover:border-cyan-500/30 bg-transparent"
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={isScanning}
            >
              <ChevronRight className="w-3 md:w-4 h-3 md:h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30">
        {/* Desktop Table View - Hidden on mobile */}
        <div className="hidden md:block overflow-x-auto">
          {/* Table Header */}
          <div className="grid grid-cols-[minmax(100px,1fr)_120px_minmax(250px,2fr)_80px_minmax(180px,2fr)_120px] lg:grid-cols-[minmax(120px,1fr)_150px_minmax(350px,2fr)_80px_minmax(200px,2fr)_140px] bg-secondary/30 border-b border-border/50 text-sm text-muted-foreground font-medium w-full min-w-[800px]">
            <div className="px-3 lg:px-4 py-3 border-r border-border/50">Block</div>
            <div className="px-3 lg:px-4 py-3 border-r border-border/50">Size, bytes</div>
            <div className="px-3 lg:px-4 py-3 border-r border-border/50">Validator</div>
            <div className="px-3 lg:px-4 py-3 border-r border-border/50 text-center">Txn</div>
            <div className="px-3 lg:px-4 py-3 border-r border-border/50">Gas used</div>
            <div className="px-3 lg:px-4 py-3">Reward SOL</div>
          </div>

          {/* Scanning Status */}
          {isScanning && (
            <div className="px-4 py-3 border-b border-border/30 bg-secondary/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">scanning new blocks...</span>
              </div>
            </div>
          )}

          {/* Table Rows */}
          <div className="divide-y divide-border/30 w-full min-w-[800px]">
            {blocks.map((block, index) => (
              <div
                key={block.number}
                className="grid grid-cols-[minmax(100px,1fr)_120px_minmax(250px,2fr)_80px_minmax(180px,2fr)_120px] lg:grid-cols-[minmax(120px,1fr)_150px_minmax(350px,2fr)_80px_minmax(200px,2fr)_140px] hover:bg-secondary/20 transition-colors duration-200 group border-b border-border/30 last:border-0"
                style={{
                  animation: `fade-in 0.3s ease-out forwards`,
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                {/* Block Number */}
                <div className="px-3 lg:px-4 py-4 border-r border-border/30">
                  <Link href={`/block/${block.number}`} className="text-cyan-400 hover:text-cyan-300 font-mono text-xs lg:text-sm">
                    {block.number.toLocaleString()}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{block.time}</p>
                </div>

                {/* Size */}
                <div className="px-3 lg:px-4 py-4 border-r border-border/30 text-xs lg:text-sm text-foreground font-mono self-center flex items-center">{block.size.toLocaleString()}</div>

                {/* Validator */}
                <div className="px-3 lg:px-4 py-4 border-r border-border/30 flex items-center gap-2 self-center overflow-hidden">
                  <div className={`w-5 lg:w-6 h-5 lg:h-6 rounded-full bg-gradient-to-br ${block.validatorColor} shrink-0`} />
                  <Link
                    href={`/address/${block.validator}`}
                    className="text-cyan-400 hover:text-cyan-300 font-mono text-xs lg:text-sm truncate"
                    title={block.validator}
                  >
                    {block.validator}
                  </Link>
                  <button
                    onClick={() => copyToClipboard(block.validator)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  >
                    {copiedAddress === block.validator ? (
                      <Check className="w-3 lg:w-3.5 h-3 lg:h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                    )}
                  </button>
                </div>

                {/* Txn Count */}
                <div className="px-3 lg:px-4 py-4 border-r border-border/30 text-center self-center flex items-center justify-center">
                  <span className="text-cyan-400 font-mono text-xs lg:text-sm">{block.txn}</span>
                </div>

                {/* Gas Used */}
                <div className="px-3 lg:px-4 py-4 border-r border-border/30 self-center">
                  <p className="text-xs lg:text-sm text-foreground font-mono mb-1">{block.gasUsed.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden max-w-16 lg:max-w-20">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500/50 to-cyan-400/50 rounded-full"
                        style={{ width: `${Math.min(block.gasPercentage * 40, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{block.gasPercentage}%</span>
                    <span className="text-xs text-muted-foreground">|</span>
                    <span className="text-xs text-muted-foreground font-mono">{block.gasChange}%</span>
                  </div>
                </div>

                {/* Reward */}
                <div className="px-3 lg:px-4 py-4 text-xs lg:text-sm text-foreground font-mono self-center flex items-center">{block.reward}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Card View - Shown only on mobile */}
        <div className="md:hidden">
          {/* Scanning Status */}
          {isScanning && (
            <div className="px-4 py-3 border-b border-border/30 bg-secondary/10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">scanning new blocks...</span>
              </div>
            </div>
          )}

          {/* Card Rows */}
          <div className="divide-y divide-border/30">
            {blocks.map((block, index) => (
              <div
                key={block.number}
                className="p-4 hover:bg-secondary/20 transition-colors duration-200 space-y-3"
                style={{
                  animation: `fade-in 0.3s ease-out forwards`,
                  animationDelay: `${index * 50}ms`,
                  opacity: 0,
                }}
              >
                {/* Block Number and Time */}
                <div className="flex items-center justify-between">
                  <div>
                    <Link href={`/block/${block.number}`} className="text-cyan-400 hover:text-cyan-300 font-mono text-sm font-medium">
                      Block {block.number.toLocaleString()}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">{block.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Txn</p>
                    <span className="text-cyan-400 font-mono text-sm font-medium">{block.txn}</span>
                  </div>
                </div>

                {/* Validator */}
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${block.validatorColor} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">Validator</p>
                    <Link
                      href={`/address/${block.validator}`}
                      className="text-cyan-400 hover:text-cyan-300 font-mono text-xs truncate block"
                      title={block.validator}
                    >
                      {block.validator}
                    </Link>
                  </div>
                  <button
                    onClick={() => copyToClipboard(block.validator)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    {copiedAddress === block.validator ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Size</p>
                    <p className="text-sm text-foreground font-mono">{block.size.toLocaleString()} bytes</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reward</p>
                    <p className="text-sm text-foreground font-mono">{block.reward}</p>
                  </div>
                </div>

                {/* Gas Used */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Gas Used</p>
                  <p className="text-sm text-foreground font-mono mb-2">{block.gasUsed.toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500/50 to-cyan-400/50 rounded-full"
                        style={{ width: `${Math.min(block.gasPercentage * 40, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">{block.gasPercentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add keyframe animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
