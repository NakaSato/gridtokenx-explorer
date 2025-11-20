import { Address, ReadonlyUint8Array } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import { addressToPublicKey } from '@/app/(shared)/utils/rpc';

export function decodeString(data: ReadonlyUint8Array) {
  return Buffer.from(data).toString('utf-8');
}

export function mapToPublicKey(address: Address) {
  return addressToPublicKey(address);
}
