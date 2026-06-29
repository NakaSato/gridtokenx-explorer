'use client';

import React from 'react';
import { ProgramPageLayout } from '@/app/(shared)/components/layout/ProgramPageLayout';
import { TradingTerminal } from '@/app/(features)/anchor-localnet/components/TradingTerminal';
import { TradingExplorer } from '@/app/(features)/anchor-localnet/components/TradingExplorer';
import { TradingParticipantsStat } from '@/app/(features)/anchor-localnet/components/TradingParticipantsStat';
import { Zap, LayoutGrid, BarChart2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/(shared)/components/ui/tabs';
import { Card, CardContent } from '@/app/(shared)/components/ui/card';

export default function TradingPage() {
  return (
    <ProgramPageLayout
      icon={Zap}
      iconColor="yellow"
      badgeText="Solana Program"
      badgeColor="yellow"
      secondaryLabel="Live Market Activity"
      secondaryValue={<TradingParticipantsStat />}
      secondaryIcon={Zap}
      secondaryColor="primary"
    >
      {({ rpcUrl, getConnection }) => (
        <Tabs defaultValue="terminal" className="w-full space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 pb-2">
            <TabsList className="bg-navy-800/50 p-1.5 h-12 border border-white/5 shadow-inner">
              <TabsTrigger 
                value="terminal" 
                className="gap-2.5 h-9 px-6 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all rounded-md"
              >
                <LayoutGrid className="h-4 w-4" />
                Terminal
              </TabsTrigger>
              <TabsTrigger 
                value="explorer" 
                className="gap-2.5 h-9 px-6 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all rounded-md"
              >
                <BarChart2 className="h-4 w-4" />
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
