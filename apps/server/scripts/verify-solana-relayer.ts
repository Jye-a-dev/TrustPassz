/**
 * apps/server/scripts/verify-solana-relayer.ts
 *
 * Standalone verification script for Solana Devnet Relayer Authority.
 * Connects to Solana Devnet RPC, queries real on-chain balance,
 * verifies optional private key parsing, and outputs faucet commands.
 */

import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  DEFAULT_SOLANA_RELAYER_PUBLIC_KEY,
  parseSolanaKeypair,
  resolveSolanaRelayerPublicKey,
} from '../src/relayer/solana-keypair.util';

// Load environment variables from apps/server/.env if available
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifySolanaRelayer(): Promise<void> {
  const rpcUrl =
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const network = process.env.SOLANA_NETWORK || 'devnet';

  console.log('===============================================================');
  console.log('      TRUSTPASSZ SOLANA RELAYER DEVNET VERIFICATION TOOL      ');
  console.log('===============================================================');
  console.log(`[Config] Target Network : ${network}`);
  console.log(`[Config] Solana RPC URL : ${rpcUrl}`);

  const connection = new Connection(rpcUrl, 'confirmed');

  // 1. Resolve and validate Relayer Public Key
  const explicitKey = process.env.SOLANA_RELAYER_PUBLIC_KEY;
  const privateKeySecret = process.env.SOLANA_RELAYER_PRIVATE_KEY;
  const parsedKeypair = parseSolanaKeypair(privateKeySecret);
  const relayerPubkey = resolveSolanaRelayerPublicKey(explicitKey, parsedKeypair);

  console.log(`[Relayer] Public Key   : ${relayerPubkey.toBase58()}`);

  if (parsedKeypair) {
    const isMatching = parsedKeypair.publicKey.equals(relayerPubkey);
    console.log(
      `[Relayer] Keypair Status: ACTIVE (Private key parsed successfully — matches pubkey: ${isMatching})`,
    );
  } else {
    console.log(
      `[Relayer] Keypair Status: MONITOR ONLY (Private key not provided or unparsed. Querying on-chain balance)`,
    );
  }

  // 2. Query On-Chain Balance
  try {
    console.log('\n[RPC] Fetching on-chain balance from Solana Devnet...');
    const lamports = await connection.getBalance(relayerPubkey, 'confirmed');
    const balanceSol = lamports / LAMPORTS_PER_SOL;

    console.log('---------------------------------------------------------------');
    console.log(`[Balance] On-Chain SOL      : ${balanceSol.toFixed(6)} SOL`);
    console.log(`[Balance] On-Chain Lamports : ${lamports.toLocaleString()} Lamports`);
    console.log('---------------------------------------------------------------');

    if (balanceSol < 0.1) {
      console.warn(
        `[WARN] Low balance alert! Ví Relayer có số dư < 0.1 SOL, cần faucet gas.`,
      );
    } else {
      console.log(`[OK] Số dư gas khả dụng đủ điều kiện vận hành Relayer on-chain.`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] Không thể kết nối Solana Devnet RPC: ${msg}`);
  }

  // 3. Output Faucet & CLI Helper Commands
  console.log('\n===============================================================');
  console.log('              SOLANA DEVNET FAUCET INSTRUCTIONS               ');
  console.log('===============================================================');
  console.log('1. Yêu cầu Airdrop 2 SOL bằng Solana CLI (khuyến nghị):');
  console.log(
    `   solana airdrop 2 ${relayerPubkey.toBase58()} --url ${rpcUrl}`,
  );
  console.log('\n2. Kiểm tra số dư qua Solana CLI:');
  console.log(
    `   solana balance ${relayerPubkey.toBase58()} --url ${rpcUrl}`,
  );
  console.log('\n3. Hoặc mở Web Faucet chính thức:');
  console.log(`   https://faucet.solana.com/ (Dán địa chỉ: ${relayerPubkey.toBase58()})`);
  console.log('===============================================================\n');
}

void verifySolanaRelayer();

