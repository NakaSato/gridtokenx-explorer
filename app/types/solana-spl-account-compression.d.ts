// Type declarations for @solana/spl-account-compression
// This is needed because the package has a broken package.json structure
declare module '@solana/spl-account-compression' {
    import { PublicKey } from '@solana/web3.js';
    
    // Main exports
    export const SPL_ACCOUNT_COMPRESSION_ADDRESS: string;
    export const SPL_ACCOUNT_COMPRESSION_PROGRAM_ID: PublicKey;
    
    // MerkleTree types
    export type MerkleTreeProof = {
        leaf: Buffer;
        leafIndex: number;
        proof: Buffer[];
        root: Buffer;
    };
    
    export type TreeNode = {
        id: number;
        left: TreeNode | undefined;
        level: number;
        node: Buffer;
        parent: TreeNode | undefined;
        right: TreeNode | undefined;
    };
    
    export class MerkleTree {
        leaves: TreeNode[];
        root: Buffer;
        depth: number;
        
        constructor(leaves: Buffer[]);
        static sparseMerkleTreeFromLeaves(leaves: Buffer[], depth: number): MerkleTree;
        getRoot(): Buffer;
        getProof(leafIndex: number, minimizeProofHeight?: boolean, treeHeight?: number, verbose?: boolean): MerkleTreeProof;
        updateLeaf(leafIndex: number, newLeaf: Buffer, verbose?: boolean): void;
        static hashProof(merkleTreeProof: MerkleTreeProof, verbose?: boolean): Buffer;
        static verify(root: Buffer, merkleTreeProof: MerkleTreeProof, verbose?: boolean): boolean;
    }
    
    // ConcurrentMerkleTreeAccount types
    export class ConcurrentMerkleTreeAccount {
        constructor(header: any, tree: any, canopy: any);
        static fromBuffer(buffer: Buffer): ConcurrentMerkleTreeAccount;
        getMaxDepth(): number;
        getMaxBufferSize(): number;
    }
    
    // Rexport all other types
    export * from '@solana/spl-account-compression/dist/types/src/generated';
    export * from '@solana/spl-account-compression/dist/types/src/instructions';
    export * from '@solana/spl-account-compression/dist/types/src/accounts';
    export * from '@solana/spl-account-compression/dist/types/src/events';
    export * from '@solana/spl-account-compression/dist/types/src/constants';
    export * from '@solana/spl-account-compression/dist/types/src/types';
}
