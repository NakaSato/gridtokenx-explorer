import { formatDisplayIdl, getIdlSpecKeyType, getIdlSpecType, LegacyOrShankIdlType, privateConvertType } from '../convertLegacyIdl';

describe('IDL::convertType', () => {
  it('passes primitives through and renames publicKey to pubkey', () => {
    expect(privateConvertType('u64' as LegacyOrShankIdlType)).toEqual('u64');
    expect(privateConvertType('string' as LegacyOrShankIdlType)).toEqual('string');
    expect(privateConvertType('publicKey' as LegacyOrShankIdlType)).toEqual('pubkey');
  });

  it('parses type.vec', () => {
    expect(privateConvertType({ vec: 'u8' } as LegacyOrShankIdlType)).toEqual({ vec: 'u8' });
  });

  it('parses type.option', () => {
    expect(privateConvertType({ option: 'publicKey' } as LegacyOrShankIdlType)).toEqual({ option: 'pubkey' });
  });

  it('parses type.defined into the generics wrapper', () => {
    expect(privateConvertType({ defined: 'OrderSide' } as LegacyOrShankIdlType)).toEqual({
      defined: { generics: [], name: 'OrderSide' },
    });
  });

  it('parses type.array preserving the length', () => {
    expect(privateConvertType({ array: ['u8', 32] } as LegacyOrShankIdlType)).toEqual({ array: ['u8', 32] });
  });

  it('parses nested vec of defined', () => {
    expect(privateConvertType({ vec: { defined: 'PriceLevel' } } as LegacyOrShankIdlType)).toEqual({
      vec: { defined: { generics: [], name: 'PriceLevel' } },
    });
  });

  it('parses generic passthrough', () => {
    const generic = { generic: 'T' };
    expect(privateConvertType(generic as LegacyOrShankIdlType)).toEqual(generic);
  });

  it('parses definedWithTypeArgs', () => {
    const type = {
      definedWithTypeArgs: {
        args: [{ type: 'u64' }, { generic: 'T' }, { value: '8' }],
        name: 'Wrapper',
      },
    };
    expect(privateConvertType(type as unknown as LegacyOrShankIdlType)).toEqual({
      defined: {
        generics: [{ type: 'u64' }, { generic: 'T' }, { value: '8' }],
        name: 'Wrapper',
      },
    });
  });

  it('parses type.option.tuple', () => {
    const type = { option: { tuple: ['u64', 'u64'] } };
    const expectedOutput = {
      option: {
        defined: {
          generics: [
            { kind: 'type', type: 'u64' },
            { kind: 'type', type: 'u64' },
          ],
          name: 'tuple[u64]',
        },
      },
    };
    expect(privateConvertType(type as unknown as LegacyOrShankIdlType)).toEqual(expectedOutput);
  });

  it('parses type.vec.tuple', () => {
    const type = { vec: { tuple: ['string', 'string'] } };
    const expectedOutput = {
      vec: {
        defined: {
          generics: [
            { kind: 'type', type: 'string' },
            { kind: 'type', type: 'string' },
          ],
          name: 'tuple[string]',
        },
      },
    };
    expect(privateConvertType(type as unknown as LegacyOrShankIdlType)).toEqual(expectedOutput);
  });

  it('throws on unsupported type shapes', () => {
    expect(() => privateConvertType({ bogus: 'u8' } as unknown as LegacyOrShankIdlType)).toThrow(/Unsupported type/);
  });
});

describe('IDL::getIdlSpecType', () => {
  it('detects codama, 0.1.0, and legacy specs', () => {
    expect(getIdlSpecType({ standard: 'codama' })).toBe('codama');
    expect(getIdlSpecType({ metadata: { spec: '0.1.0' } })).toBe('0.1.0');
    expect(getIdlSpecType({ metadata: {} })).toBe('legacy');
    expect(getIdlSpecType(undefined)).toBe('legacy');
  });

  it('distinguishes shank-origin legacy IDLs', () => {
    expect(getIdlSpecKeyType({ metadata: { origin: 'shank' } })).toBe('legacy-shank');
    expect(getIdlSpecKeyType({ metadata: {} })).toBe('legacy');
  });
});

describe('IDL::formatDisplayIdl (legacy end-to-end)', () => {
  const PROGRAM_ID = 'CnWDEUhTvSixeLSyViWgAnnu9YouBAYVGcrrFm1s9WcX';

  const legacyIdl = {
    accounts: [
      {
        name: 'Market',
        type: {
          fields: [
            { name: 'marketAuthority', type: 'publicKey' },
            { name: 'side', type: { defined: 'OrderSide' } },
            { name: 'levels', type: { vec: { defined: 'PriceLevel' } } },
          ],
          kind: 'struct',
        },
      },
    ],
    errors: [{ code: 6000, msg: 'Price out of bounds', name: 'InvalidPrice' }],
    events: [{ fields: [{ index: false, name: 'orderId', type: 'u64' }], name: 'OrderPlaced' }],
    instructions: [
      {
        accounts: [
          { isMut: true, isSigner: true, name: 'marketAuthority' },
          {
            accounts: [{ isMut: false, isSigner: false, name: 'zoneMarket' }],
            name: 'zoneAccounts',
          },
        ],
        args: [{ name: 'pricePerKwh', type: 'u64' }],
        name: 'placeOrder',
      },
    ],
    name: 'trading',
    types: [
      {
        name: 'OrderSide',
        type: { kind: 'enum', variants: [{ name: 'Sell' }, { fields: ['u64'], name: 'Buy' }] },
      },
      {
        name: 'PriceLevel',
        type: {
          fields: [{ name: 'totalAmount', type: 'u64' }],
          kind: 'struct',
        },
      },
      {
        // Referenced by nothing — must be pruned by removeUnusedTypes.
        name: 'UnusedType',
        type: { fields: [{ name: 'x', type: 'u8' }], kind: 'struct' },
      },
    ],
    version: '0.1.0',
  };

  it('converts a legacy IDL into the new spec shape', () => {
    const idl = formatDisplayIdl(legacyIdl, PROGRAM_ID);

    expect(idl.address).toBe(PROGRAM_ID);
    expect(idl.metadata).toMatchObject({ name: 'trading', version: '0.1.0' });

    // Instruction: names snake_cased, nested account groups preserved
    const ix = idl.instructions[0];
    expect(ix.name).toBe('place_order');
    expect(ix.args).toEqual([{ name: 'price_per_kwh', type: 'u64' }]);
    expect(ix.accounts[0]).toMatchObject({ name: 'market_authority', signer: true, writable: true });
    expect(ix.accounts[1]).toMatchObject({
      accounts: [expect.objectContaining({ name: 'zone_market', signer: false, writable: false })],
      name: 'zone_accounts',
    });

    // Account gets an 8-byte discriminator
    expect(idl.accounts?.[0].name).toBe('Market');
    expect(idl.accounts?.[0].discriminator).toHaveLength(8);

    // Events keep their name + discriminator; errors carried over
    expect(idl.events?.[0]).toMatchObject({ name: 'OrderPlaced' });
    expect(idl.errors?.[0]).toEqual({ code: 6000, msg: 'Price out of bounds', name: 'InvalidPrice' });

    // Enum variants: tuple-style fields become bare types
    const orderSide = idl.types?.find(t => t.name === 'OrderSide');
    expect(orderSide?.type).toEqual({
      kind: 'enum',
      variants: [{ fields: undefined, name: 'Sell' }, { fields: ['u64'], name: 'Buy' }],
    });

    // Types referenced transitively survive; unreferenced ones are pruned
    expect(idl.types?.map(t => t.name)).toContain('PriceLevel');
    expect(idl.types?.map(t => t.name)).not.toContain('UnusedType');
  });

  it('throws when no program id is available', () => {
    expect(() => formatDisplayIdl({ ...legacyIdl, metadata: undefined })).toThrow(/Program id missing/);
  });

  it('uses idl.metadata.address as a fallback program id', () => {
    const idl = formatDisplayIdl({ ...legacyIdl, metadata: { address: PROGRAM_ID } });
    expect(idl.address).toBe(PROGRAM_ID);
  });
});
