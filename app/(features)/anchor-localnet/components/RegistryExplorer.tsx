'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/app/(shared)/components/ui/badge';
import { Button } from '@/app/(shared)/components/ui/button';
import { ScrollArea } from '@/app/(shared)/components/ui/scroll-area';
import { Skeleton } from '@/app/(shared)/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/(shared)/components/ui/dialog';
import { Input } from '@/app/(shared)/components/ui/input';
import { Label } from '@/app/(shared)/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/(shared)/components/ui/select';
import {
  Database,
  RefreshCw,
  Users,
  Gauge,
  MapPin,
  Sun,
  Wind,
  Battery,
  Grid3X3,
  Plus,
} from 'lucide-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { PROGRAMS, ENUM_MAPS } from '../config';

interface RegistryExplorerProps {
  rpcUrl: string;
  getConnection: () => Connection;
}

interface RegistryData {
  address: string;
  authority: string;
  userCount: number;
  meterCount: number;
  activeMeterCount: number;
  hasOracleAuthority: boolean;
  oracleAuthority: string;
}

interface UserData {
  address: string;
  authority: string;
  userType: string;
  status: string;
  lat: number;
  lng: number;
  h3Index: string;
  registeredAt: number;
  meterCount: number;
}

interface MeterData {
  address: string;
  meterId: string;
  owner: string;
  meterType: string;
  status: string;
  registeredAt: number;
  lastReadingAt: number;
  totalGeneration: number;
  totalConsumption: number;
  settledNetGeneration: number;
  claimedErcGeneration: number;
}

const METER_TYPE_ICONS: Record<string, React.ReactNode> = {
  Solar: <Sun className="h-3 w-3 text-yellow-500" />,
  Wind: <Wind className="h-3 w-3 text-cyan-500" />,
  Battery: <Battery className="h-3 w-3 text-green-500" />,
  Grid: <Grid3X3 className="h-3 w-3 text-blue-500" />,
};

export function RegistryExplorer({ rpcUrl, getConnection }: RegistryExplorerProps) {
  const [registry, setRegistry] = useState<RegistryData | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [meters, setMeters] = useState<MeterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'users' | 'meters'>('overview');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateMeter, setShowCreateMeter] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const conn = getConnection();
      const programId = new PublicKey(PROGRAMS.registry.id);
      const accounts = await conn.getProgramAccounts(programId);

      let registryData: RegistryData | null = null;
      const userList: UserData[] = [];
      const meterList: MeterData[] = [];

      for (const { pubkey, account } of accounts) {
        const data = account.data;
        const addr = pubkey.toBase58();
        const size = data.length;

        // Registry account (zero_copy): ~96 bytes + discriminator
        if (size >= 96 && size < 120) {
          try {
            const d = data.slice(8);
            const authority = new PublicKey(d.slice(0, 32)).toBase58();
            const oracleAuthority = new PublicKey(d.slice(32, 64)).toBase58();
            const hasOracleAuthority = d[64] === 1;
            // Skip 7 padding
            const userCount = Number(d.readBigUInt64LE(72));
            const meterCount = Number(d.readBigUInt64LE(80));
            const activeMeterCount = Number(d.readBigUInt64LE(88));

            registryData = {
              address: addr,
              authority,
              userCount,
              meterCount,
              activeMeterCount,
              hasOracleAuthority,
              oracleAuthority: hasOracleAuthority ? oracleAuthority : '',
            };
          } catch { /* skip */ }
        }
        // UserAccount (zero_copy): 80 bytes + discriminator = 88
        else if (size >= 88 && size < 96) {
          try {
            const d = data.slice(8);
            const authority = new PublicKey(d.slice(0, 32)).toBase58();
            const userType = d[32];
            // skip 3 padding
            const latE7 = d.readInt32LE(36);
            const longE7 = d.readInt32LE(40);
            // skip 4 padding
            const h3Index = d.readBigUInt64LE(48).toString(16);
            const status = d[56];
            // skip 7 padding
            const registeredAt = Number(d.readBigInt64LE(64));
            const meterCount = d.readUInt32LE(72);

            userList.push({
              address: addr,
              authority,
              userType: ENUM_MAPS.UserType[userType as keyof typeof ENUM_MAPS.UserType] ?? `Unknown(${userType})`,
              status: ENUM_MAPS.UserStatus[status as keyof typeof ENUM_MAPS.UserStatus] ?? `Unknown(${status})`,
              lat: latE7 / 1e7,
              lng: longE7 / 1e7,
              h3Index,
              registeredAt,
              meterCount,
            });
          } catch { /* skip */ }
        }
        // MeterAccount (zero_copy): larger, ~128+ bytes
        else if (size >= 128) {
          try {
            const d = data.slice(8);
            const meterIdBytes = d.slice(0, 32);
            const meterId = Buffer.from(meterIdBytes).toString('utf8').replace(/\0/g, '');
            const owner = new PublicKey(d.slice(32, 64)).toBase58();
            const meterType = d[64];
            const meterStatus = d[65];
            // skip 6 padding
            const registeredAt = Number(d.readBigInt64LE(72));
            const lastReadingAt = Number(d.readBigInt64LE(80));
            const totalGeneration = Number(d.readBigUInt64LE(88));
            const totalConsumption = Number(d.readBigUInt64LE(96));
            const settledNetGeneration = Number(d.readBigUInt64LE(104));
            const claimedErcGeneration = Number(d.readBigUInt64LE(112));

            meterList.push({
              address: addr,
              meterId: meterId || addr.slice(0, 12),
              owner,
              meterType: ENUM_MAPS.MeterType[meterType as keyof typeof ENUM_MAPS.MeterType] ?? `Unknown(${meterType})`,
              status: ENUM_MAPS.MeterStatus[meterStatus as keyof typeof ENUM_MAPS.MeterStatus] ?? `Unknown(${meterStatus})`,
              registeredAt,
              lastReadingAt,
              totalGeneration,
              totalConsumption,
              settledNetGeneration,
              claimedErcGeneration,
            });
          } catch { /* skip */ }
        }
      }

      setRegistry(registryData);
      setUsers(userList);
      setMeters(meterList);
    } catch (err) {
      console.warn('RegistryExplorer fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getConnection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Database className="h-4 w-4 text-emerald-500" />
          Registry Program
          <Badge variant="outline" className="font-mono text-[9px]">
            {PROGRAMS.registry.id.slice(0, 8)}...
          </Badge>
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setShowCreateUser(true)}
          >
            <Plus className="h-3 w-3" /> User
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setShowCreateMeter(true)}
          >
            <Plus className="h-3 w-3" /> Meter
          </Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={fetchData}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
      </div>

      {/* Registry Stats */}
      {registry ? (
        <div className="rounded-lg border bg-card p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Registry State</h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Registered Users</p>
              <p className="font-mono text-sm font-bold">{registry.userCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Total Meters</p>
              <p className="font-mono text-sm font-bold">{registry.meterCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Active Meters</p>
              <p className="font-mono text-sm font-bold text-green-500">{registry.activeMeterCount}</p>
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <p className="font-mono text-[9px] text-muted-foreground">Authority: {registry.authority}</p>
            {registry.hasOracleAuthority && (
              <p className="font-mono text-[9px] text-muted-foreground">Oracle: {registry.oracleAuthority}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Database className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">
            No registry found. Run <code className="rounded bg-muted px-1">initialize</code> first.
          </p>
        </div>
      )}

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeView === 'overview' ? 'default' : 'outline'}
          size="sm" className="h-7 gap-1 text-xs"
          onClick={() => setActiveView('overview')}
        >
          Overview
        </Button>
        <Button
          variant={activeView === 'users' ? 'default' : 'outline'}
          size="sm" className="h-7 gap-1 text-xs"
          onClick={() => setActiveView('users')}
        >
          <Users className="h-3 w-3" /> Users ({users.length})
        </Button>
        <Button
          variant={activeView === 'meters' ? 'default' : 'outline'}
          size="sm" className="h-7 gap-1 text-xs"
          onClick={() => setActiveView('meters')}
        >
          <Gauge className="h-3 w-3" /> Meters ({meters.length})
        </Button>
      </div>

      {/* Users List */}
      {activeView === 'users' && (
        <ScrollArea className="h-[300px] rounded-md border">
          {users.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">No users found</div>
          ) : (
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.address} className="p-3 text-xs hover:bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      <span className="font-mono text-[11px] font-medium">
                        {user.authority.slice(0, 8)}...{user.authority.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[9px]">{user.userType}</Badge>
                      <Badge
                        variant={user.status === 'Active' ? 'default' : 'secondary'}
                        className="text-[9px]"
                      >
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Gauge className="h-3 w-3" /> {user.meterCount} meters
                    </span>
                    {(user.lat !== 0 || user.lng !== 0) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {user.lat.toFixed(4)}, {user.lng.toFixed(4)}
                      </span>
                    )}
                    <span>H3: {user.h3Index}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {/* Meters List */}
      {activeView === 'meters' && (
        <ScrollArea className="h-[300px] rounded-md border">
          {meters.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">No meters found</div>
          ) : (
            <div className="divide-y">
              {meters.map((meter) => (
                <div key={meter.address} className="p-3 text-xs hover:bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {METER_TYPE_ICONS[meter.meterType] ?? <Gauge className="h-3 w-3" />}
                      <span className="font-medium">{meter.meterId}</span>
                      <Badge variant="outline" className="text-[9px]">{meter.meterType}</Badge>
                    </div>
                    <Badge
                      variant={meter.status === 'Active' ? 'default' : meter.status === 'Maintenance' ? 'secondary' : 'destructive'}
                      className="text-[9px]"
                    >
                      {meter.status}
                    </Badge>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground sm:grid-cols-4">
                    <span>Gen: {meter.totalGeneration.toLocaleString()}</span>
                    <span>Con: {meter.totalConsumption.toLocaleString()}</span>
                    <span>Settled: {meter.settledNetGeneration.toLocaleString()}</span>
                    <span>ERC Claimed: {meter.claimedErcGeneration.toLocaleString()}</span>
                  </div>
                  <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                    Owner: {meter.owner.slice(0, 12)}... | Last Reading: {
                      meter.lastReadingAt > 0
                        ? new Date(meter.lastReadingAt * 1000).toLocaleString()
                        : 'Never'
                    }
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      )}

      {/* Instructions */}
      {activeView === 'overview' && (
        <div className="rounded-lg border p-3">
          <h4 className="mb-2 text-xs font-semibold text-muted-foreground">Available Instructions</h4>
          <div className="flex flex-wrap gap-1">
            {PROGRAMS.registry.instructions.map((ix) => (
              <Badge key={ix} variant="outline" className="font-mono text-[9px]">{ix}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Create User Dialog */}
      <CreateUserDialog
        open={showCreateUser}
        onOpenChange={setShowCreateUser}
        rpcUrl={rpcUrl}
        onSuccess={fetchData}
      />

      {/* Create Meter Dialog */}
      <CreateMeterDialog
        open={showCreateMeter}
        onOpenChange={setShowCreateMeter}
        rpcUrl={rpcUrl}
        users={users}
        onSuccess={fetchData}
      />
    </div>
  );
}

// Create User Dialog Component
interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rpcUrl: string;
  onSuccess: () => void;
}

function CreateUserDialog({ open, onOpenChange, rpcUrl, onSuccess }: CreateUserDialogProps) {
  const [userType, setUserType] = useState('Prosumer');
  const [lat, setLat] = useState('13.7563');
  const [lng, setLng] = useState('100.5018');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setTxSignature(null);

    try {
      // Call API to create user
      const response = await fetch('/api/registry/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const data = await response.json();
      setTxSignature(data.signature);

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setTxSignature(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create New User
          </DialogTitle>
          <DialogDescription>
            Register a new user in the GridTokenX registry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="userType">User Type</Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Prosumer">Prosumer (Producer + Consumer)</SelectItem>
                <SelectItem value="Consumer">Consumer (Consumer Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </div>
          </div>

          {txSignature && (
            <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700">
              ✅ User created! TX: {txSignature.slice(0, 20)}...
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
              ❌ Error: {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Create Meter Dialog Component
interface CreateMeterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rpcUrl: string;
  users: UserData[];
  onSuccess: () => void;
}

function CreateMeterDialog({ open, onOpenChange, rpcUrl, users, onSuccess }: CreateMeterDialogProps) {
  const [meterId, setMeterId] = useState('');
  const [meterType, setMeterType] = useState('Solar');
  const [owner, setOwner] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    setTxSignature(null);

    try {
      const response = await fetch('/api/registry/create-meter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meterId: meterId || `METER-${Date.now()}`,
          meterType,
          owner,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create meter');
      }

      const data = await response.json();
      setTxSignature(data.signature);

      setTimeout(() => {
        onSuccess();
        onOpenChange(false);
        setTxSignature(null);
        setMeterId('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create New Meter
          </DialogTitle>
          <DialogDescription>
            Register a smart meter for an existing user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="owner">Owner</Label>
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger>
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.authority} value={user.authority}>
                    {user.authority.slice(0, 8)}... ({user.userType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meterId">Meter ID</Label>
            <Input
              id="meterId"
              placeholder={`METER-${Date.now()}`}
              value={meterId}
              onChange={(e) => setMeterId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meterType">Meter Type</Label>
            <Select value={meterType} onValueChange={setMeterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Solar">☀️ Solar</SelectItem>
                <SelectItem value="Wind">💨 Wind</SelectItem>
                <SelectItem value="Battery">🔋 Battery</SelectItem>
                <SelectItem value="Grid">⚡ Grid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {txSignature && (
            <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700">
              ✅ Meter created! TX: {txSignature.slice(0, 20)}...
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
              ❌ Error: {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !owner}>
            {isSubmitting ? 'Creating...' : 'Create Meter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
