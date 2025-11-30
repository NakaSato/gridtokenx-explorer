"use client"

import { useState } from "react"
import { Search, Zap } from "lucide-react"
import { Button } from "@/app/(shared)/components/ui/button"
import { Input } from "@/app/(shared)/components/ui/input"
import Link from "next/link"

export function SearchHeader() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="relative overflow-hidden border-b border-border/50 bg-card/50 backdrop-blur-sm">
      {/* Circuit lines decoration */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0 animate-grid-energy"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 211, 238, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 211, 238, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative px-6 py-4 md:px-12 lg:px-16">
        <div className="flex items-center gap-6">

          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 w-4 h-4" />
            <Input
              placeholder="Search by address / txn hash / block / token..."
              className="w-full bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground pl-11 pr-6 py-5 rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-cyan-400/50 focus-visible:border-cyan-400/50 transition-all duration-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
