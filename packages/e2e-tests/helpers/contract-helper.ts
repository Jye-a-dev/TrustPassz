import {
  createPublicClient,
  createWalletClient,
  http,
  type Hash,
  type Address,
  parseAbi,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { ORACLE_RELAYER_ACCOUNT } from '../fixtures/test-wallets';

export enum OnchainDealState {
  Uninitialized = 0,
  Pending = 1,
  Deposited = 2,
  InInspection = 3,
  Settled = 4,
  Refunded = 5,
  Disputed = 6,
}

export interface OnchainDealConfig {
  buyer: Address;
  seller: Address;
  token: Address;
  amount: bigint;
  inspectionDuration: bigint;
}

export interface OnchainDealStateData {
  state: OnchainDealState;
  depositedAt: bigint;
  inspectionDeadline: bigint;
  disputeInitiator: Address;
  createdAt: bigint;
}

export interface OnchainDealResult {
  config: OnchainDealConfig;
  stateData: OnchainDealStateData;
}

export const DIGITAL_ESCROW_ABI = parseAbi([
  'function createDeal(bytes32 dealId, (address buyer, address seller, address token, uint256 amount, uint256 inspectionDuration) config) external',
  'function deposit(bytes32 dealId) external payable',
  'function startInspection(bytes32 dealId) external',
  'function settle(bytes32 dealId) external',
  'function raiseDispute(bytes32 dealId) external',
  'function resolveDispute(bytes32 dealId, bool refundBuyer) external',
  'function getDeal(bytes32 dealId) external view returns ((address buyer, address seller, address token, uint256 amount, uint256 inspectionDuration) config, (uint8 state, uint256 depositedAt, uint256 inspectionDeadline, address disputeInitiator, uint256 createdAt) stateData)',
]);

export const DEFAULT_CONTRACT_ADDRESS: Address = (process.env.ESCROW_CONTRACT_ADDRESS ||
  '0xef976eb14fdba8cb722789b451e2b9f903005c26') as Address;

export const DEFAULT_RPC_URL =
  process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

/**
 * Normalizes UUID (32 hex characters without hyphens) into 64-char bytes32 hex string.
 */
export function toDealIdBytes32(dealId: string): `0x${string}` {
  const stripped = dealId.replace(/-/g, '');
  if (stripped.length !== 32) {
    throw new Error(
      `Invalid dealId format: expected UUID (32 hex chars), got "${dealId}"`,
    );
  }
  return `0x${stripped.padEnd(64, '0')}`;
}

export class ContractHelper {
  public readonly publicClient;
  public readonly walletClient;
  public readonly contractAddress: Address;

  constructor(
    rpcUrl: string = DEFAULT_RPC_URL,
    contractAddress: Address = DEFAULT_CONTRACT_ADDRESS,
    privateKey: `0x${string}` = ORACLE_RELAYER_ACCOUNT.privateKey,
  ) {
    this.contractAddress = contractAddress;
    this.publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(rpcUrl),
    });

    const account = privateKeyToAccount(privateKey);
    this.walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    });
  }

  /**
   * Verifies if smart contract code is deployed at the designated address.
   */
  async isContractDeployed(): Promise<boolean> {
    try {
      const code = await this.publicClient.getBytecode({
        address: this.contractAddress,
      });
      return Boolean(code && code !== '0x');
    } catch {
      return false;
    }
  }

  /**
   * Reads the on-chain Escrow status directly from Base Sepolia.
   */
  async getDeal(dealId: string): Promise<OnchainDealResult | null> {
    const bytes32Id = toDealIdBytes32(dealId);
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        abi: DIGITAL_ESCROW_ABI,
        functionName: 'getDeal',
        args: [bytes32Id],
      });

      const [config, stateData] = result as [
        {
          buyer: Address;
          seller: Address;
          token: Address;
          amount: bigint;
          inspectionDuration: bigint;
        },
        {
          state: number;
          depositedAt: bigint;
          inspectionDeadline: bigint;
          disputeInitiator: Address;
          createdAt: bigint;
        },
      ];

      return {
        config: {
          buyer: config.buyer,
          seller: config.seller,
          token: config.token,
          amount: config.amount,
          inspectionDuration: config.inspectionDuration,
        },
        stateData: {
          state: stateData.state as OnchainDealState,
          depositedAt: stateData.depositedAt,
          inspectionDeadline: stateData.inspectionDeadline,
          disputeInitiator: stateData.disputeInitiator,
          createdAt: stateData.createdAt,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('DealNotFound') || msg.includes('revert')) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Initializes deal escrow on-chain.
   */
  async createDeal(
    dealId: string,
    buyer: Address,
    seller: Address,
    amountWei: bigint,
    inspectionDurationSec: bigint,
  ): Promise<Hash> {
    const bytes32Id = toDealIdBytes32(dealId);
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: DIGITAL_ESCROW_ABI,
      functionName: 'createDeal',
      args: [
        bytes32Id,
        {
          buyer,
          seller,
          token: '0x0000000000000000000000000000000000000000',
          amount: amountWei,
          inspectionDuration: inspectionDurationSec,
        },
      ],
    });

    await this.publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    return hash;
  }

  /**
   * Settles deal escrow on-chain releasing funds to seller.
   */
  async settle(dealId: string): Promise<Hash> {
    const bytes32Id = toDealIdBytes32(dealId);
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: DIGITAL_ESCROW_ABI,
      functionName: 'settle',
      args: [bytes32Id],
    });

    await this.publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    return hash;
  }

  /**
   * Resolves on-chain dispute: refund buyer (true) or payout seller (false).
   */
  async resolveDispute(dealId: string, refundBuyer: boolean): Promise<Hash> {
    const bytes32Id = toDealIdBytes32(dealId);
    const hash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: DIGITAL_ESCROW_ABI,
      functionName: 'resolveDispute',
      args: [bytes32Id, refundBuyer],
    });

    await this.publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    return hash;
  }
}
