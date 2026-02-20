/**
 * GridTokenX Anchor Program Configuration
 * Contains all program addresses, PDA seeds, and account schemas
 * for localnet tracking and exploration.
 */

export const PROGRAMS = {
  trading: {
    id: '3LXbBJ7sWYYrveHvLoLtwuVYbYd27HPcbpF1DQ8rK1Bo',
    name: 'Trading',
    description: 'P2P energy trading marketplace with CDA and batch execution',
    seeds: {
      market: [Buffer.from('market')],
      order: (authority: string, orderId: number) => [
        Buffer.from('order'),
        Buffer.from(authority),
        Buffer.from(new Uint8Array(new BigUint64Array([BigInt(orderId)]).buffer)),
      ],
      trade: (buyOrder: string, sellOrder: string) => [
        Buffer.from('trade'),
        Buffer.from(buyOrder),
        Buffer.from(sellOrder),
      ],
    },
    accounts: ['Market', 'Order', 'TradeRecord', 'MarketShard'],
    instructions: [
      'initialize_program', 'initialize_market',
      'create_sell_order', 'create_buy_order',
      'match_orders', 'cancel_order',
      'submit_limit_order', 'submit_market_order',
      'add_order_to_batch', 'execute_batch', 'cancel_batch',
      'update_depth', 'update_price_history',
      'execute_atomic_settlement', 'update_market_params',
    ],
    events: [
      'MarketInitialized', 'SellOrderCreated', 'BuyOrderCreated',
      'OrderMatched', 'OrderCancelled', 'LimitOrderSubmitted',
      'MarketOrderSubmitted', 'DepthUpdated', 'PriceHistoryUpdated',
      'BatchExecuted', 'BatchCancelled', 'OrderAddedToBatch',
      'MarketParamsUpdated',
    ],
  },
  energy_token: {
    id: 'GzEcWzkb73zcgvgoNRxEiuuT7CEAbzbHcAgjNV25pbLV',
    name: 'Energy Token',
    description: 'GRX token minting, metadata, and transfers via Metaplex',
    seeds: {},
    accounts: ['TokenInfo', 'MeterReading'],
    instructions: [
      'initialize', 'create_token_mint',
      'mint_to_meter', 'burn_tokens', 'transfer_tokens',
    ],
    events: [],
  },
  governance: {
    id: 'DuLg6buhqs78SRj1qDp5vSyGrSfG9FF4nPKm8Tn8hSJL',
    name: 'Governance',
    description: 'ERC certificates, PoA governance, and authority management',
    seeds: {
      poa_config: [Buffer.from('poa_config')],
    },
    accounts: ['PoAConfig', 'ErcCertificate'],
    instructions: [
      'initialize_poa', 'issue_erc', 'validate_erc_for_trading',
      'revoke_erc', 'transfer_erc',
      'update_governance_config', 'set_maintenance_mode',
      'update_erc_limits', 'update_authority_info',
      'get_governance_stats',
      'propose_authority_change', 'approve_authority_change', 'cancel_authority_change',
      'set_oracle_authority',
    ],
    events: [],
  },
  oracle: {
    id: 'BRctXUydec2wrP4k2NpqZZT2sVnMfGqpv9bmWn5mTWh9',
    name: 'Oracle',
    description: 'Meter readings, energy data validation, and anomaly detection',
    seeds: {
      oracle_data: [Buffer.from('oracle_data')],
    },
    accounts: ['OracleData'],
    instructions: [
      'initialize', 'submit_meter_reading',
      'run_clearing', 'set_active', 'update_config',
      'add_backup_oracle', 'remove_backup_oracle',
    ],
    events: [
      'MeterReadingSubmitted', 'ClearingCompleted',
      'OracleStatusChanged', 'AnomalyDetected',
    ],
  },
  registry: {
    id: 'EmiSgo85FVUYWXPtScCMQZBpq9ecZ4jhveg7E7T7F75z',
    name: 'Registry',
    description: 'Participant registration, meter management, and zone assignments',
    seeds: {
      registry: [Buffer.from('registry')],
      user: (authority: string) => [Buffer.from('user'), Buffer.from(authority)],
      meter: (owner: string, meterId: string) => [Buffer.from('meter'), Buffer.from(owner), Buffer.from(meterId)],
    },
    accounts: ['Registry', 'UserAccount', 'MeterAccount'],
    instructions: [
      'initialize', 'register_user', 'register_meter',
      'update_meter_reading', 'deactivate_meter',
      'set_oracle_authority',
    ],
    events: [
      'UserRegistered', 'MeterRegistered',
      'MeterReadingUpdated', 'MeterDeactivated',
    ],
  },
  blockbench: {
    id: 'B7Detx5TMRQNzVCgdd9Rp5YnN9cAtC7KeMBrzdZZsd4E',
    name: 'Blockbench',
    description: 'TPC-C performance benchmarking for Solana',
    seeds: {},
    accounts: [],
    instructions: [],
    events: [],
  },
} as const;

export type ProgramKey = keyof typeof PROGRAMS;

export const ALL_PROGRAM_IDS = Object.values(PROGRAMS).map(p => p.id);

/** Enum maps for Registry program */
export const ENUM_MAPS = {
  UserType: { 0: 'Prosumer', 1: 'Consumer' },
  UserStatus: { 0: 'Active', 1: 'Suspended', 2: 'Inactive' },
  MeterType: { 0: 'Solar', 1: 'Wind', 2: 'Battery', 3: 'Grid' },
  MeterStatus: { 0: 'Active', 1: 'Inactive', 2: 'Maintenance' },
  OrderType: { 0: 'Buy', 1: 'Sell' },
  OrderStatus: { 0: 'Active', 1: 'PartiallyFilled', 2: 'Completed', 3: 'Cancelled', 4: 'Expired' },
  ErcStatus: { 0: 'Valid', 1: 'Expired', 2: 'Revoked', 3: 'Pending' },
} as const;
