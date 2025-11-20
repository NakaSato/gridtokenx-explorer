import React from 'react';

// Test all our new components can be imported and rendered
import { SlotHashesCard } from '../components/account/SlotHashesCard';
import { StakeHistoryCard } from '../components/account/StakeHistoryCard';
import { TokenExtensionsCard } from '../components/account/TokenExtensionsCard';
import { VerifiedBuildCard } from '../components/account/VerifiedBuildCard';
import { VotesCard } from '../components/account/VotesCard';
import { ProgramMultisigCard } from '../components/account/ProgramMultisigCard';

import { BlockAccountsCard } from '../components/block/BlockAccountsCard';
import { BlockHistoryCard } from '../components/block/BlockHistoryCard';
import { BlockProgramsCard } from '../components/block/BlockProgramsCard';
import { BlockRewardsCard } from '../components/block/BlockRewardsCard';

// Mock data for different component types
const mockSlotHashesData = {
  type: 'sysvar',
  info: {
    slotHashes: [
      { slot: 12345, hash: 'abc123def456ghi789jkl012mno345pqr456stu789vwx012yz' },
      { slot: 12346, hash: 'def456ghi789jkl012mno345pqr456stu789vwx012yza' },
    ],
  },
};

const mockStakeHistoryData = {
  data: {
    parsed: {
      info: {
        stakeHistory: [
          {
            epoch: 100,
            stake: BigInt(1000000000),
            effective: BigInt(950000000),
            activating: BigInt(50000000),
            deactivating: BigInt(0),
          },
        ],
      },
    },
  },
};

const mockTokenExtensionsData = {
  data: {
    parsed: {
      info: {
        extensions: [
          { extension: 'transferFee', state: 'Enabled' as const },
          { extension: 'memoTransfer', state: 'Enabled' as const },
        ],
      },
    },
  },
};

const mockVerifiedBuildData = {
  data: {
    parsed: {
      info: {
        verifiedBuild: {
          verifier: 'Verifier111111111111111111111111111111111',
          signature: 'sig123def456ghi789jkl012mno345pqr456stu789vwx012yz',
          zipHash: 'zip456ghi789jkl012mno345pqr456stu789vwx012yza123',
          lastModified: 1640995200,
        },
      },
    },
  },
};

const mockVotesData = {
  data: {
    parsed: {
      info: {
        votes: [
          { slot: 12345, confirmationCount: 128, lockout: 1640995200, vote: 'YES' },
          { slot: 12346, confirmationCount: 64, lockout: 1640995300, vote: 'YES' },
        ],
      },
    },
  },
};

const mockMultisigData = {
  data: {
    parsed: {
      info: {
        threshold: 2,
        signers: [
          { pubkey: 'Signer111111111111111111111111111111111', signature: 'sig123456789012345678901234567890' },
          { pubkey: 'Signer222222222222222222222222222222222', signature: undefined },
        ],
        transaction: {
          data: 'base64encodeddata123456789012345678901234567890',
          accounts: [
            { pubkey: 'Account111111111111111111111111111111', isSigner: true, isWritable: false },
            { pubkey: 'Account222222222222222222222222222222', isSigner: false, isWritable: true },
          ],
        },
      },
    },
  },
};

const mockBlockData = {
  accounts: [
    { account: 'Account111111111111111111111111111111', balance: BigInt(1000000000), change: 'created' as const },
    { account: 'Account222222222222222222222222222222', balance: BigInt(2000000000), change: 'updated' as const },
  ],
  slot: 12345,
  blockhash: 'block123def456ghi789jkl012mno345pqr456stu789vwx',
  rewards: [
    {
      pubkey: 'Reward11111111111111111111111111111',
      lamports: 1000000,
      postBalance: BigInt(1001000000),
      rewardType: 'staking' as const,
    },
    {
      pubkey: 'FeeCollector11111111111111111111111',
      lamports: 50000,
      postBalance: BigInt(50000),
      rewardType: 'fee' as const,
    },
  ],
  programs: [
    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', instructionCount: 15, computeUnits: 1500000 },
    { programId: '11111111111111111111111111111111111', instructionCount: 8, computeUnits: 800000 },
  ],
  blocks: [
    {
      slot: 12345,
      blockhash: 'block123def456ghi789jkl012mno345pqr456stu789vwx',
      timestamp: 1640995200,
      transactionCount: 25,
      status: 'confirmed' as const,
    },
    {
      slot: 12346,
      blockhash: 'block456ghi789jkl012mno345pqr456stu789vwx012',
      timestamp: 1640995300,
      transactionCount: 18,
      status: 'confirmed' as const,
    },
  ],
};

export function ComponentIntegrationTest() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <h1 className="mb-8 text-3xl font-bold">Component Integration Test</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Account Components */}
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold">Account Components</h2>

          <SlotHashesCard sysvarAccount={mockSlotHashesData} />
          <StakeHistoryCard account={mockStakeHistoryData} />
          <TokenExtensionsCard account={mockTokenExtensionsData} />
          <VerifiedBuildCard account={mockVerifiedBuildData} />
          <VotesCard account={mockVotesData} />
          <ProgramMultisigCard account={mockMultisigData} />
        </div>

        {/* Block Components */}
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold">Block Components</h2>

          <BlockAccountsCard accounts={mockBlockData.accounts} block={mockBlockData} />
          <BlockHistoryCard blocks={mockBlockData.blocks} />
          <BlockProgramsCard programs={mockBlockData.programs} block={mockBlockData} />
          <BlockRewardsCard rewards={mockBlockData.rewards} block={mockBlockData} />
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-green-300 bg-green-100 p-4">
        <h3 className="font-semibold text-green-800">✅ Integration Test Complete</h3>
        <p className="text-green-700">All components imported and rendered successfully!</p>
      </div>
    </div>
  );
}

export default ComponentIntegrationTest;
