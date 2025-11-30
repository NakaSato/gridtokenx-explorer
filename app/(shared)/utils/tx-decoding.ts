import { VersionedMessage } from '@solana/web3.js';
import bs58 from 'bs58';

export const MIN_MESSAGE_LENGTH = 64; // Re-defining here or importing if it was exported from somewhere else. 
// In SearchBar.tsx it was imported from RawInputCard. Let's check if we should import it or just define it.
// The original code imported it: import { MIN_MESSAGE_LENGTH } from '@/app/(features)/transactions/components/inspector/RawInputCard';
// I will keep the import if possible, or just redefine it to avoid circular deps if RawInputCard imports this file.
// For now, let's assume we can import it, or just use a constant. 
// Actually, looking at the original file, it was imported. 
// Let's just define it here to be safe and self-contained, or import it. 
// I'll import it to match original behavior, but if it causes issues I'll fix.

// Actually, to make this utility pure, I should probably just define the constant here or accept it as an arg.
// Let's redefine it to avoid dependency on a component file.

export function decodeTransactionFromBase64(base64String: string): {
  message: string;
  signatures?: string[];
} | null {
  try {
    const buffer = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));

    if (buffer.length < MIN_MESSAGE_LENGTH) {
      return null;
    }

    // Try to parse as full transaction first
    let offset = 0;
    const numSignatures = buffer[offset++];

    // Check if message version matches signatures
    const requiredSignaturesByteOffset = 1 + numSignatures * 64;
    const versionOffset =
      VersionedMessage.deserializeMessageVersion(buffer.slice(requiredSignaturesByteOffset)) !== 'legacy' ? 1 : 0;

    const numRequiredSignaturesFromMessage = buffer[requiredSignaturesByteOffset + versionOffset];

    const signatures: string[] = [];

    // If signatures match message requirements, parse as full transaction
    if (numRequiredSignaturesFromMessage === numSignatures) {
      for (let i = 0; i < numSignatures; i++) {
        const sigBytes = buffer.subarray(offset, offset + 64);
        if (sigBytes.length !== 64) return null;
        signatures.push(bs58.encode(sigBytes));
        offset += 64;
      }

      // Encode remaining buffer as base64 message
      const messageBase64 = btoa(String.fromCharCode.apply(null, Array.from(buffer.slice(offset))));
      return {
        message: messageBase64,
        signatures,
      };
    }

    // If no valid signatures found, treat entire buffer as message
    return {
      message: base64String,
    };
  } catch (err) {
    return null;
  }
}

export function isValidBase64(str: string): boolean {
  try {
    Buffer.from(str, 'base64');
    return true;
  } catch (err) {
    return false;
  }
}
