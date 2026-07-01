'use client';

import React from 'react';
import { ProgramPageLayout } from '@/app/(shared)/components/layout/ProgramPageLayout';
import { TradingTerminal } from '@/app/(features)/anchor-localnet/components/TradingTerminal';
import { TradingExplorer } from '@/app/(features)/anchor-localnet/components/TradingExplorer';
import { Zap, LayoutGrid, BarChart2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/(shared)/components/ui/tabs';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';

export default function TradingPage() {
  return (
    <ProgramPageLayout
      icon={Zap}
      iconColor="yellow"
      contentClassName="overflow-hidden p-0"
    >
      {({ rpcUrl, getConnection }) => (
        <Tabs defaultValue="terminal" className="w-full space-y-2 font-mono">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-[#2a2a2a] pb-0">
            <TabsList className="h-auto gap-0 rounded-none border border-[#2a2a2a] bg-[#111] p-0">
              <TabsTrigger
                value="terminal"
                className="gap-2 rounded-none border-r border-[#2a2a2a] px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-[#888] transition-colors data-[state=active]:bg-[#9945FF] data-[state=active]:text-black data-[state=active]:shadow-none"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Terminal
              </TabsTrigger>
              <TabsTrigger
                value="explorer"
                className="gap-2 rounded-none px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-[#888] transition-colors data-[state=active]:bg-[#9945FF] data-[state=active]:text-black data-[state=active]:shadow-none"
              >
                <BarChart2 className="h-3.5 w-3.5" />
                Accounts
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="terminal" className="mt-0 outline-none focus-visible:ring-0">
             <TradingTerminal rpcUrl={rpcUrl} getConnection={getConnection} />
          </TabsContent>

          <TabsContent value="explorer" className="mt-0 outline-none focus-visible:ring-0">
             <TradingExplorer rpcUrl={rpcUrl} getConnection={getConnection} />
          </TabsContent>
        </Tabs>
      )}
    </ProgramPageLayout>
  );
}
