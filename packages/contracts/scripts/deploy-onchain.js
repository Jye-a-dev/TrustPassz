const fs = require('fs');
const path = require('path');
const {
  createPublicClient,
  createWalletClient,
  http,
  encodeDeployData,
} = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { baseSepolia } = require('viem/chains');

async function main() {
  const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
  const privateKey =
    process.env.DEPLOYER_PRIVATE_KEY ||
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  const account = privateKeyToAccount(privateKey);
  console.log('Deployer Address:', account.address);

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log('Deployer Balance (ETH):', Number(balance) / 1e18);

  const binPath = path.resolve(__dirname, '../src_DigitalEscrow_sol_DigitalEscrow.bin');
  const bytecodeHex = '0x' + fs.readFileSync(binPath, 'utf8').trim();

  const abi = require('./canonical-abi.json');

  const oracleRelayer =
    process.env.ORACLE_RELAYER_ADDRESS || account.address;
  const disputeResolver =
    process.env.DISPUTE_RESOLVER_ADDRESS || account.address;

  console.log('Constructor parameters:');
  console.log('  Owner:           ', account.address);
  console.log('  Oracle Relayer:  ', oracleRelayer);
  console.log('  Dispute Resolver:', disputeResolver);

  console.log('\nDeploying DigitalEscrow to Base Sepolia...');

  const deployTxHash = await walletClient.deployContract({
    abi,
    bytecode: bytecodeHex,
    args: [account.address, oracleRelayer, disputeResolver],
  });

  console.log('Deployment Tx Hash:', deployTxHash);
  console.log('Awaiting confirmation on Base Sepolia...');

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: deployTxHash,
  });

  console.log('Transaction confirmed in block:', receipt.blockNumber);
  console.log('Deployed Contract Address:', receipt.contractAddress);

  if (!receipt.contractAddress) {
    throw new Error('Deployment failed: receipt did not contain contractAddress');
  }

  // Verify bytecode
  const deployedCode = await publicClient.getBytecode({
    address: receipt.contractAddress,
  });
  console.log('Contract code length (bytes):', (deployedCode.length - 2) / 2);

  // Read back state
  const ownerResult = await publicClient.readContract({
    address: receipt.contractAddress,
    abi,
    functionName: 'owner',
  });
  console.log('Verified on-chain owner:', ownerResult);

  // Write broadcast record so Foundry tooling and export scripts recognise it
  const broadcastDir = path.resolve(
    __dirname,
    '../broadcast/DeployEscrow.s.sol/84532'
  );
  fs.mkdirSync(broadcastDir, { recursive: true });
  const broadcastData = {
    transactions: [
      {
        contractName: 'DigitalEscrow',
        contractAddress: receipt.contractAddress,
        hash: deployTxHash,
        transactionType: 'CREATE',
      },
    ],
    receipts: [receipt],
  };
  fs.writeFileSync(
    path.join(broadcastDir, 'run-latest.json'),
    JSON.stringify(broadcastData, null, 2),
    'utf8'
  );
  console.log('Saved broadcast log to run-latest.json');

  // Trigger export-artifacts.js to sync the new address and ABI across the monorepo
  process.env.DEPLOYED_ESCROW_ADDRESS = receipt.contractAddress;
  console.log('\nRunning export-artifacts.js pipeline...');
  require('./export-artifacts.js');

  console.log('\n[SUCCESS] Contract deployed and synced successfully!');
  console.log('Contract Address:', receipt.contractAddress);
  console.log('Explorer URL: https://sepolia.basescan.org/address/' + receipt.contractAddress);
}

main().catch((err) => {
  console.error('Fatal error deploying contract:', err);
  process.exit(1);
});
