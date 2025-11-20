import {
  isSerumInstruction,
  parseSerumInstructionTitle,
} from '@/app/(features)/transactions/components/instruction/serum/types';
import { IX_TITLES, TokenInstructionType } from '@/app/(features)/transactions/components/instruction/token/types';
import {
  isTokenLendingInstruction,
  parseTokenLendingInstructionTitle,
} from '@/app/(features)/transactions/components/instruction/token-lending/types';
import {
  isTokenSwapInstruction,
  parseTokenSwapInstructionTitle,
} from '@/app/(features)/transactions/components/instruction/token-swap/types';
import { isTokenProgramId } from '@/app/(core)/providers/accounts/tokens';
import {
  ConfirmedSignatureInfo,
  ParsedInstruction,
  ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
  TransactionInstruction,
} from '@solana/web3.js';
import { isTokenProgram } from '@/app/(shared)/utils/programs';
import {
  intoTransactionInstruction,
  TransactionInstruction as CustomTransactionInstruction,
} from '@/app/(shared)/utils/tx';
import { ParsedInfo } from '@/app/validators/index';
import { create } from 'superstruct';

export type InstructionType = {
  name: string;
  innerInstructions: (ParsedInstruction | PartiallyDecodedInstruction)[];
};

export interface InstructionItem {
  instruction: ParsedInstruction | PartiallyDecodedInstruction;
  inner: (ParsedInstruction | PartiallyDecodedInstruction)[];
}

export class InstructionContainer {
  readonly instructions: InstructionItem[];

  static create(transactionWithMeta: ParsedTransactionWithMeta) {
    return new InstructionContainer(transactionWithMeta);
  }

  constructor(transactionWithMeta: ParsedTransactionWithMeta) {
    this.instructions = transactionWithMeta.transaction.message.instructions.map(instruction => {
      if ('parsed' in instruction) {
        if (typeof instruction.parsed === 'object') {
          instruction.parsed = create(instruction.parsed, ParsedInfo);
        } else if (typeof instruction.parsed !== 'string') {
          throw new Error('Unexpected parsed response');
        }
      }

      return {
        inner: [],
        instruction,
      };
    });

    if (transactionWithMeta.meta?.innerInstructions) {
      for (const inner of transactionWithMeta.meta.innerInstructions) {
        this.instructions[inner.index].inner.push(...inner.instructions);
      }
    }
  }
}

export function getTokenProgramInstructionName(ix: ParsedInstruction, signatureInfo: ConfirmedSignatureInfo): string {
  try {
    const parsed = create(ix.parsed, ParsedInfo);
    const { type: rawType } = parsed;
    const type = create(rawType, TokenInstructionType);
    return IX_TITLES[type];
  } catch (err) {
    console.error(err, { signature: signatureInfo.signature });
    return 'Unknown';
  }
}

export function getTokenInstructionName(
  transactionWithMeta: ParsedTransactionWithMeta,
  ix: ParsedInstruction | PartiallyDecodedInstruction,
  signatureInfo: ConfirmedSignatureInfo,
) {
  let name = 'Unknown';

  let transactionInstruction: CustomTransactionInstruction | undefined;
  if (transactionWithMeta?.transaction) {
    transactionInstruction = intoTransactionInstruction(transactionWithMeta.transaction, ix);
  }

  if ('parsed' in ix) {
    if (isTokenProgram(ix.program)) {
      return getTokenProgramInstructionName(ix, signatureInfo);
    } else {
      return undefined;
    }
  }

  if (transactionInstruction) {
    try {
      if (isSerumInstruction(transactionInstruction)) {
        return parseSerumInstructionTitle(transactionInstruction);
      } else if (isTokenSwapInstruction(transactionInstruction)) {
        return parseTokenSwapInstructionTitle(transactionInstruction);
      } else if (isTokenLendingInstruction(transactionInstruction)) {
        return parseTokenLendingInstructionTitle(transactionInstruction);
      }
    } catch (error) {
      console.error(error, { signature: signatureInfo.signature });
      return undefined;
    }
  }

  if (ix.accounts.findIndex(account => isTokenProgramId(account)) >= 0) {
    name = 'Unknown (Inner)';
  } else {
    return undefined;
  }

  return name;
}

export function getTokenInstructionType(
  transactionWithMeta: ParsedTransactionWithMeta,
  ix: ParsedInstruction | PartiallyDecodedInstruction,
  signatureInfo: ConfirmedSignatureInfo,
  index: number,
): InstructionType | undefined {
  const innerInstructions: (ParsedInstruction | PartiallyDecodedInstruction)[] = [];

  if (transactionWithMeta.meta?.innerInstructions) {
    transactionWithMeta.meta.innerInstructions.forEach(ix => {
      if (ix.index === index) {
        ix.instructions.forEach(inner => {
          innerInstructions.push(inner);
        });
      }
    });
  }

  const name = getTokenInstructionName(transactionWithMeta, ix, signatureInfo) || 'Unknown';

  return {
    innerInstructions,
    name,
  };
}
