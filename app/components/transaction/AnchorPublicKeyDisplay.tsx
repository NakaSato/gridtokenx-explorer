'use client';

import { PublicKey, Keypair } from '@solana/web3.js';
import { addressToPublicKey, toAddress } from '@utils/rpc';
import React from 'react';
import { useCluster } from '@providers/cluster';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { Address } from '@components/common/Address';

interface AnchorPublicKeyDisplayProps {
  publicKey: string | PublicKey;
  label?: string;
  showCopyButton?: boolean;
  showLink?: boolean;
  truncate?: boolean;
  truncateChars?: number;
  customStyle?: React.CSSProperties;
  showClusterInfo?: boolean;
}

export function AnchorPublicKeyDisplay({
  publicKey,
  label = 'Public Key',
  showCopyButton = true,
  showLink = true,
  truncate = false,
  truncateChars = 12,
  customStyle,
  showClusterInfo = true,
}: AnchorPublicKeyDisplayProps) {
  const { cluster, url, status } = useCluster();

  // Convert string to PublicKey if needed
  const pubkey = typeof publicKey === 'string' ? addressToPublicKey(toAddress(publicKey)) : publicKey;
  const pubkeyString = pubkey.toBase58();

  const isAnchorNetwork = url.includes('localhost') || url.includes('127.0.0.1') || cluster === Cluster.Custom;

  const getClusterBadge = () => {
    switch (cluster) {
      case Cluster.MainnetBeta:
        return <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">Mainnet</span>;
      case Cluster.Testnet:
        return <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">Testnet</span>;
      case Cluster.Devnet:
        return <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">Devnet</span>;
      case Cluster.Custom:
        return <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">Custom RPC</span>;
      default:
        return null;
    }
  };

  const getNetworkInfo = () => {
    if (!showClusterInfo) return null;

    return (
      <div className="mb-2 flex items-center gap-2">
        {getClusterBadge()}
        {isAnchorNetwork && (
          <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-800">🔧 Anchor Network</span>
        )}
        <span className="text-muted-foreground text-sm">
          Status: {status === ClusterStatus.Connected ? '🟢' : status === ClusterStatus.Connecting ? '🟡' : '🔴'}{' '}
          {status}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-lg border shadow-sm" style={customStyle}>
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h6 className="card-title mb-0">{label}</h6>
          {isAnchorNetwork && (
            <div className="flex items-center gap-2">
              <span className="text-success text-sm">🔗</span>
              <span className="text-muted-foreground text-sm">Anchor RPC</span>
            </div>
          )}
        </div>
      </div>
      <div className="p-6">
        {getNetworkInfo()}

        <div className="flex items-center gap-3">
          <div className="flex-grow">
            <Address
              pubkey={pubkey}
              link={showLink}
              truncate={truncate}
              truncateChars={truncateChars}
              alignRight={false}
            />
          </div>
        </div>

        {/* Additional information for Anchor networks */}
        {isAnchorNetwork && (
          <div className="border-top mt-3 pt-3">
            <div className="row">
              <div className="col-md-6">
                <small className="text-muted-foreground">Network URL:</small>
                <div className="small text-break font-mono">{url}</div>
              </div>
              <div className="col-md-6">
                <small className="text-muted-foreground">Key Length:</small>
                <div className="small font-mono">{pubkeyString.length} characters</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions for Anchor developers */}
        {isAnchorNetwork && (
          <div className="mt-3">
            <div className="btn-group" role="group">
              <button
                className="border-primary text-primary hover:bg-primary rounded-md border px-3 py-1.5 text-sm hover:text-white"
                onClick={() => {
                  navigator.clipboard.writeText(pubkeyString);
                  // You could add a toast notification here
                }}
              >
                📋 Copy Key
              </button>
              <button
                className="rounded-md border border-blue-500 px-3 py-1.5 text-sm text-blue-500 hover:bg-blue-500 hover:text-white"
                onClick={() => {
                  window.open(`/address/${pubkeyString}`, '_blank');
                }}
              >
                🔍 View Details
              </button>
              <button
                className="rounded-md border border-gray-500 px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-500 hover:text-white"
                onClick={() => {
                  // Generate keypair for testing (only on localhost)
                  if (url.includes('localhost')) {
                    const testKeypair = Keypair.generate().publicKey.toBase58();
                    console.log('Generated test keypair:', testKeypair);
                  }
                }}
              >
                🎲 Generate Test
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Specialized component for displaying multiple public keys
interface AnchorPublicKeyListProps {
  publicKeys: Array<{
    key: string | PublicKey;
    label?: string;
    description?: string;
  }>;
  title?: string;
  showClusterInfo?: boolean;
}

export function AnchorPublicKeyList({
  publicKeys,
  title = 'Public Keys',
  showClusterInfo = true,
}: AnchorPublicKeyListProps) {
  const { cluster, url } = useCluster();
  const isAnchorNetwork = url.includes('localhost') || url.includes('127.0.0.1') || cluster === Cluster.Custom;

  if (!publicKeys || publicKeys.length === 0) {
    return (
      <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
        <strong>No public keys provided</strong>
        <p className="small mb-0">Add public keys to display them on the Anchor network.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="border-b px-6 py-4">
        <h5 className="card-title mb-0">
          {title}
          {isAnchorNetwork && (
            <span className="ml-2 inline-flex items-center rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
              Anchor Network
            </span>
          )}
        </h5>
      </div>
      <div className="p-6">
        {publicKeys.map((item, index) => (
          <div key={index} className={index > 0 ? 'border-top mt-3 pt-3' : ''}>
            <AnchorPublicKeyDisplay
              publicKey={item.key}
              label={item.label || `Key ${index + 1}`}
              showClusterInfo={showClusterInfo && index === 0} // Only show cluster info for first item
              truncate={true}
              truncateChars={16}
            />
            {item.description && <p className="text-muted-foreground mt-2 mb-0 text-sm">{item.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// Component for displaying a program's public key with special Anchor features
interface AnchorProgramKeyDisplayProps {
  programId: string | PublicKey;
  programName?: string;
  showIdlStatus?: boolean;
  onFetchIdl?: () => void;
}

export function AnchorProgramKeyDisplay({
  programId,
  programName,
  showIdlStatus = true,
  onFetchIdl,
}: AnchorProgramKeyDisplayProps) {
  const { url, cluster } = useCluster();
  const isAnchorNetwork = url.includes('localhost') || url.includes('127.0.0.1') || cluster === Cluster.Custom;

  return (
    <div className="card border-primary">
      <div className="card-header bg-primary text-white">
        <div className="flex items-center justify-between">
          <h6 className="card-title mb-0">{programName || 'Anchor Program'}</h6>
          {isAnchorNetwork && (
            <span className="text-primary inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
              🔧 Custom RPC
            </span>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="mb-3">
          <small className="text-muted-foreground">Program ID:</small>
          <div className="mt-1 flex items-center gap-2">
            <Address
              pubkey={typeof programId === 'string' ? addressToPublicKey(toAddress(programId)) : programId}
              link={true}
              truncate={false}
              alignRight={false}
            />
          </div>
        </div>

        {showIdlStatus && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>IDL Status:</strong>
                <span className="ml-2">Available on-chain</span>
              </div>
              {onFetchIdl && (
                <button
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm"
                  onClick={onFetchIdl}
                >
                  Fetch IDL
                </button>
              )}
            </div>
          </div>
        )}

        {isAnchorNetwork && (
          <div className="text-muted-foreground text-sm">
            <div className="mb-2 flex items-center gap-2">
              <span>🔧</span>
              <span>This program is running on a custom Anchor RPC network</span>
            </div>
            <div className="text-break font-mono">{url}</div>
          </div>
        )}
      </div>
    </div>
  );
}
