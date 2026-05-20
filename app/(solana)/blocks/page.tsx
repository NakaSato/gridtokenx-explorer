import { SearchHeader } from "@/app/(shared)/components/search-header"
import { BlocksTable } from "@/app/(shared)/components/blocks-table"

export default function BlocksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed grid background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.02] animate-grid-energy"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34, 211, 238, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34, 211, 238, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>
      
      <SearchHeader />
      <main className="relative px-6 py-8 md:px-12 lg:px-16">
        <BlocksTable />
      </main>
    </div>
  )
}
