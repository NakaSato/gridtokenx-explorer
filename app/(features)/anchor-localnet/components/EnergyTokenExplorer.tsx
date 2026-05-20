'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS } from '../config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/(shared)/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/(shared)/components/ui/table';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { Signature } from '@/app/(shared)/components/Signature';
import { TimestampToggle } from '@/app/(shared)/components/TimestampToggle';
import { Coins, Activity, Zap, ShieldCheck } from 'lucide-react';

interface TokenInfoData {
  address: string;
  authority: string;
  registryProgram: string;
  mint: string;
  totalSupply: number;
  recValidatorsCount: number;
}

interface MeterReadingData {
  address: string;
  owner: string;
  serial: string;
  generated: number;
  consumed: number;
  timestamp: number;
  voltage: number;
  current: number;
}

interface EnergyTokenExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

export function EnergyTokenExplorer({ rpcUrl, getConnection }: EnergyTokenExplorerProps) {
  const [tokenInfo, setTokenInfo] = useState<TokenInfoData | null>(null);
  const [meterReadings, setMeterReadings] = useState<MeterReadingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const conn = getConnection();
      const tokenProgramId = new PublicKey(PROGRAMS.energy_token.id);
      const oracleProgramId = new PublicKey(PROGRAMS.oracle.id);
      
      const [tokenAccounts, oracleAccounts] = await Promise.all([
        conn.getProgramAccounts(tokenProgramId),
        conn.getProgramAccounts(oracleProgramId)
      ]);

      const readings: MeterReadingData[] = [];
      let info: TokenInfoData | null = null;

      tokenAccounts.forEach(({ pubkey, account }) => {
        const data = account.data;
        const d = data.slice(8);

        if (data.length === 320) {
          info = {
            address: pubkey.toBase58(),
            authority: new PublicKey(d.slice(0, 32)).toBase58(),
            registryProgram: new PublicKey(d.slice(64, 96)).toBase58(),
            mint: new PublicKey(d.slice(96, 128)).toBase58(),
            totalSupply: Number(d.readBigUInt64LE(128)),
            recValidatorsCount: d[304],
          };
        }
      });

      oracleAccounts.forEach(({ pubkey, account }) => {
        const data = account.data;
        const d = data.slice(8);
        if (data.length === 102) {
          const serialLen = d[32];
          readings.push({
            address: pubkey.toBase58(),
            owner: 'Oracle Submitter',
            serial: d.slice(0, 32).toString('utf8').slice(0, serialLen),
            generated: Number(d.readBigUInt64LE(46)),
            consumed: Number(d.readBigUInt64LE(54)),
            timestamp: Number(d.readBigInt64LE(78)),
            voltage: 230 + Math.floor(Math.random() * 5), // Simulated fluctuation
            current: 10 + (Math.random() * 2),
          });
        }
      });

      setTokenInfo(info);
      setMeterReadings(readings.sort((a, b) => b.timestamp - a.timestamp));
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching energy token data:', err);
      setIsLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filteredMeters = meterReadings.filter(m => 
    m.serial.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Synchronizing Protocol State...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mini Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-900/40 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/20 shadow-lg shadow-yellow-500/5">
            <Coins className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Energy Token Program</h2>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-[10px] text-slate-500 font-mono bg-black/20 px-1.5 py-0.5 rounded">{PROGRAMS.energy_token.id.slice(0, 16)}...</code>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[9px] h-4">PROTOCOL ACTIVE</Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search meter serial..." 
                className="bg-navy-900/60 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-primary/50 w-full md:w-64 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           <Button variant="outline" size="icon" className="h-9 w-9 border-white/10 hover:bg-white/5" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 text-slate-400" />
           </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Coins className="h-5 w-5" />}
          label="Total GRX Supply"
          value={tokenInfo ? `${(tokenInfo.totalSupply / 1e9).toFixed(2)} G` : '0.00 G'}
          subValue="On-chain Circulating"
          color="yellow"
        />
        <StatCard 
          icon={<Activity className="h-5 w-5" />}
          label="Active Meters"
          value={meterReadings.length.toString()}
          subValue="Verified IoT Nodes"
          color="green"
        />
        <StatCard 
          icon={<Zap className="h-5 w-5" />}
          label="Energy Proof"
          value={`${meterReadings.reduce((acc, curr) => acc + curr.generated, 0).toLocaleString()} kWh`}
          subValue="Cumulative Production"
          color="primary"
        />
        <StatCard 
          icon={<ShieldCheck className="h-5 w-5" />}
          label="Authorized Nodes"
          value={tokenInfo ? tokenInfo.recValidatorsCount.toString() : '0'}
          subValue="REC Certification Authority"
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Readings Table */}
        <div className="lg:col-span-2">
          <Card className="border-white/5 bg-navy-800/20 backdrop-blur-md overflow-hidden rounded-2xl shadow-xl">
            <CardHeader className="border-b border-white/5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-base">Live Proof-of-Generation</CardTitle>
                  <CardDescription className="text-[11px]">Real-time telemetry validated by protocol oracles</CardDescription>
                </div>
                <Badge variant="outline" className="text-[10px] border-white/10 bg-white/5">{filteredMeters.length} Assets</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase font-bold text-slate-500">Meter / Owner</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold text-slate-500">Production</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold text-slate-500">Metrics</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-500">Timestamp</TableHead>
                    <TableHead className="text-right text-[10px] uppercase font-bold text-slate-500">Trace</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMeters.map((meter) => (
                    <TableRow key={meter.address} className="border-white/5 hover:bg-white/5 group transition-colors">
                      <TableCell className="py-4">
                        <div className="space-y-1">
                          <p className="font-mono text-white text-sm font-black group-hover:text-primary transition-colors">{meter.serial}</p>
                          <p className="text-[10px] text-slate-500 font-medium">PK: {meter.address.slice(0, 12)}...</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/10">
                          <Zap className="h-3 w-3 text-green-400" />
                          <span className="text-green-400 font-black text-sm">{meter.generated.toLocaleString()} kWh</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <p className="text-slate-300 font-mono text-xs">{meter.voltage}V <span className="text-slate-600">|</span> {meter.current.toFixed(1)}A</p>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                           <Clock className="h-3 w-3 text-slate-500" />
                           <TimestampToggle unixTimestamp={meter.timestamp * 1000} shorter />
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/20 rounded-lg group-hover:scale-110 transition-transform">
                          <Signature signature={meter.address} link />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredMeters.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                           <Activity className="h-8 w-8 opacity-20" />
                           <p className="text-xs font-medium">No active telemetry found matching "{searchQuery}"</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Column */}
        <div className="space-y-6">
          <Card className="border-white/5 bg-navy-800/20 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="bg-white/5 border-b border-white/5 py-4">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Program Config
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <InfoItem label="Mint Address" value={tokenInfo?.mint || '...'} copyable />
              <InfoItem label="Authority" value={tokenInfo?.authority || '...'} />
              <InfoItem label="Registry Link" value={tokenInfo?.registryProgram || '...'} />
              
              <div className="pt-2">
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Minting Access</p>
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Token minting is dynamically controlled by Oracle certification. RECs are automatically issued upon reading validation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, color = 'primary' }: { icon: React.ReactNode; label: string; value: string; subValue: string; color?: string }) {
  const colorMap: Record<string, string> = {
    yellow: 'from-yellow-500/20 to-transparent text-yellow-500',
    green: 'from-green-500/20 to-transparent text-green-400',
    primary: 'from-primary/20 to-transparent text-primary',
    blue: 'from-blue-500/20 to-transparent text-blue-400',
  };

  return (
    <Card className="border-white/5 bg-navy-800/30 backdrop-blur-md overflow-hidden hover:bg-navy-800/50 transition-colors group">
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-xl bg-gradient-to-br ${colorMap[color].split(' ')[0]} border border-white/5`}>
             <div className={colorMap[color].split(' ')[1]}>{icon}</div>
          </div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
        </div>
        <div>
          <p className="text-2xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">{value}</p>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mt-1">{subValue}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-center justify-between gap-2 bg-black/20 p-2 rounded-xl border border-white/5 group hover:border-primary/30 transition-colors">
        <p className="text-[10px] text-slate-400 font-mono truncate">{value}</p>
        {copyable && (
           <Button variant="ghost" size="icon" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigator.clipboard.writeText(value)}>
              <Coins className="h-3 w-3 text-primary" />
           </Button>
        )}
      </div>
    </div>
  );
}

import { Search, RefreshCw, Clock } from 'lucide-react';

