'use client';

import React from 'react';
import { useCluster } from '@/app/(core)/providers/cluster';
import { Cluster } from '@/app/(shared)/utils/cluster';
import { useAnchorLocalnet } from '@/app/(features)/anchor-localnet/hooks/useAnchorLocalnet';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { Connection } from '@solana/web3.js';

interface ProgramPageLayoutProps {
  title?: string;
  description?: string;
  icon: LucideIcon;
  iconColor: string;
  badgeText?: string;
  badgeColor?: string;
  secondaryLabel?: string;
  secondaryValue?: React.ReactNode;
  secondaryIcon?: LucideIcon;
  secondaryColor?: string;
  contentClassName?: string;
  children: (props: { rpcUrl: string; getConnection: () => Connection }) => React.ReactNode;
}

export function ProgramPageLayout({
  title,
  description,
  icon: Icon,
  iconColor,
  badgeText,
  badgeColor = 'primary',
  secondaryLabel,
  secondaryValue,
  secondaryIcon: SecondaryIcon,
  secondaryColor = 'primary',
  contentClassName = 'rounded-3xl border border-white/5 bg-navy-800/20 backdrop-blur-sm overflow-hidden shadow-2xl p-8',
  children,
}: ProgramPageLayoutProps) {
  const { cluster, url } = useCluster();
  const isLocalnet = cluster === Cluster.Localnet;
  const { getConnection } = useAnchorLocalnet(url, isLocalnet);

  // Map common colors to Tailwind classes
  const colorMap: Record<string, string> = {
    primary: 'bg-primary text-primary',
    yellow: 'bg-yellow-500 text-yellow-500',
    orange: 'bg-orange-500 text-orange-400',
    green: 'bg-green-600 text-green-400',
    blue: 'bg-blue-600 text-blue-400',
    indigo: 'bg-indigo-600 text-indigo-400',
  };

  const bgGradientMap: Record<string, string> = {
    primary: 'bg-primary/10',
    yellow: 'bg-yellow-500/5',
    orange: 'bg-orange-500/10',
    green: 'bg-green-500/10',
    blue: 'bg-blue-500/10',
    indigo: 'bg-indigo-500/10',
  };

  const badgeClass = colorMap[badgeColor] || colorMap.primary;
  const bgClass = bgGradientMap[iconColor] || bgGradientMap.primary;

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 selection:bg-primary/30">


      <div className="container relative mx-auto px-4 py-8">
        {/* Page Header */}
        {(badgeText || title || description || secondaryLabel) && (
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            {(badgeText || title || description) && (
              <div className="space-y-2">
              {badgeText && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${badgeClass.replace('bg-', 'bg-').split(' ')[0]}/10 ${badgeClass.split(' ')[1]} border-${badgeColor}-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold`}>
                    {badgeText}
                  </Badge>
                </div>
              )}
              {title && (
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center gap-4 text-white">
                  <div className={`rounded-2xl ${badgeClass.split(' ')[0]} p-2.5 shadow-lg shadow-${badgeColor}-500/20`}>
                    <Icon className="h-8 w-8 text-navy-900 fill-navy-900" />
                  </div>
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-slate-400 text-lg max-w-2xl font-medium">
                  {description}
                </p>
              )}
            </div>
          )}

          {secondaryLabel && (
            <div className="flex items-center gap-3 bg-navy-800/50 backdrop-blur-md border border-white/5 p-4 rounded-2xl shadow-xl">
               <div className={`${bgClass.replace('/10', '/20')} p-2 rounded-full`}>
                  {SecondaryIcon && <SecondaryIcon className={`h-5 w-5 ${colorMap[secondaryColor].split(' ')[1]}`} />}
               </div>
               <div className="text-xs">
                  <p className="text-slate-400 font-bold uppercase tracking-tighter">{secondaryLabel}</p>
                  <p className={`font-mono font-bold ${colorMap[secondaryColor].split(' ')[1]}`}>{secondaryValue}</p>
               </div>
            </div>
          )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="space-y-8">
           <div className={contentClassName}>
              {children({ rpcUrl: url, getConnection })}
           </div>
        </div>
      </div>
    </div>
  );
}
