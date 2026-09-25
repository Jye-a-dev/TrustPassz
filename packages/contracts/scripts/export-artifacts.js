#!/usr/bin/env node
/**
 * @file export-artifacts.js
 * @notice Production pipeline script for synchronizing DigitalEscrow ABI & contract address across TrustPassz monorepo.
 */

const fs = require("fs");
const path = require("path");

const CONTRACT_NAME = "DigitalEscrow";
const ROOT_DIR = path.resolve(__dirname, "..");
const MONOREPO_ROOT = path.resolve(ROOT_DIR, "../..");

const ARTIFACT_PATH = path.join(ROOT_DIR, "out", `${CONTRACT_NAME}.sol`, `${CONTRACT_NAME}.json`);
const BROADCAST_PATH = path.join(ROOT_DIR, "broadcast", "DeployEscrow.s.sol", "84532", "run-latest.json");

const TARGET_PACKAGES = [
  {
    name: "server",
    abiDir: path.join(MONOREPO_ROOT, "apps", "server", "src", "abi"),
    envFile: path.join(MONOREPO_ROOT, "apps", "server", ".env"),
    envExample: path.join(MONOREPO_ROOT, "apps", "server", ".env.example"),
    envKey: "ESCROW_CONTRACT_ADDRESS",
  },
  {
    name: "cl_user",
    abiDir: path.join(MONOREPO_ROOT, "apps", "cl_user", "src", "abi"),
    envFile: path.join(MONOREPO_ROOT, "apps", "cl_user", ".env.local"),
    envExample: path.join(MONOREPO_ROOT, "apps", "cl_user", ".env.example"),
    envKey: "NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS",
  },
  {
    name: "mb_user",
    abiDir: path.join(MONOREPO_ROOT, "apps", "mb_user", "src", "abi"),
    envFile: path.join(MONOREPO_ROOT, "apps", "mb_user", ".env"),
    envExample: path.join(MONOREPO_ROOT, "apps", "mb_user", ".env.example"),
    envKey: "EXPO_PUBLIC_ESCROW_CONTRACT_ADDRESS",
  },
];

// Canonical fallback ABI if out/ directory has not been populated by forge yet
const CANONICAL_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_owner", type: "address", internalType: "address" },
      { name: "_oracleRelayer", type: "address", internalType: "address" },
      { name: "_disputeResolver", type: "address", internalType: "address" }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "DELIVERY_TIMEOUT",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "cancelDepositedDeal",
    inputs: [{ name: "dealId", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "createDeal",
    inputs: [
      { name: "dealId", type: "bytes32", internalType: "bytes32" },
      {
        name: "config",
        type: "tuple",
        internalType: "struct EscrowTypes.DealConfig",
        components: [
          { name: "buyer", type: "address", internalType: "address" },
          { name: "seller", type: "address", internalType: "address" },
          { name: "token", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "inspectionDuration", type: "uint256", internalType: "uint256" }
        ]
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "deposit",
    inputs: [{ name: "dealId", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "disputeResolver",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getDeal",
    inputs: [{ name: "dealId", type: "bytes32", internalType: "bytes32" }],
    outputs: [
      {
        name: "config",
        type: "tuple",
        internalType: "struct EscrowTypes.DealConfig",
        components: [
          { name: "buyer", type: "address", internalType: "address" },
          { name: "seller", type: "address", internalType: "address" },
          { name: "token", type: "address", internalType: "address" },
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "inspectionDuration", type: "uint256", internalType: "uint256" }
        ]
      },
      {
        name: "stateData",
        type: "tuple",
        internalType: "struct EscrowTypes.DealStateData",
        components: [
          { name: "state", type: "uint8", internalType: "enum EscrowTypes.DealState" },
          { name: "depositedAt", type: "uint256", internalType: "uint256" },
          { name: "inspectionDeadline", type: "uint256", internalType: "uint256" },
          { name: "disputeInitiator", type: "address", internalType: "address" },
          { name: "createdAt", type: "uint256", internalType: "uint256" }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "oracleRelayer",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "raiseDispute",
    inputs: [{ name: "dealId", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "resolveDispute",
    inputs: [
      { name: "dealId", type: "bytes32", internalType: "bytes32" },
      { name: "refundBuyer", type: "bool", internalType: "bool" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setDisputeResolver",
    inputs: [{ name: "_newResolver", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setOracleRelayer",
    inputs: [{ name: "_newOracle", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "settle",
    inputs: [{ name: "dealId", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "startInspection",
    inputs: [{ name: "dealId", type: "bytes32", internalType: "bytes32" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "_newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "event",
    name: "DealCreated",
    inputs: [
      { name: "dealId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "buyer", type: "address", indexed: true, internalType: "address" },
      { name: "seller", type: "address", indexed: true, internalType: "address" },
      { name: "token", type: "address", indexed: false, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DealDeposited",
    inputs: [
      { name: "dealId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "buyer", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DealRefunded",
    inputs: [
      { name: "dealId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "buyer", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DealSettled",
    inputs: [
      { name: "dealId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "recipient", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DisputeRaised",
    inputs: [
      { name: "dealId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "initiator", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DisputeResolved",
    inputs: [
      { name: "dealId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "finalState", type: "uint8", indexed: false, internalType: "enum EscrowTypes.DealState" },
      { name: "recipient", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "DisputeResolverUpdated",
    inputs: [
      { name: "previousResolver", type: "address", indexed: true, internalType: "address" },
      { name: "newResolver", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "InspectionStarted",
    inputs: [
      { name: "dealId", type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "inspectionDeadline", type: "uint256", indexed: false, internalType: "uint256" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OracleRelayerUpdated",
    inputs: [
      { name: "previousOracle", type: "address", indexed: true, internalType: "address" },
      { name: "newOracle", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "OwnerUpdated",
    inputs: [
      { name: "previousOwner", type: "address", indexed: true, internalType: "address" },
      { name: "newOwner", type: "address", indexed: true, internalType: "address" }
    ],
    anonymous: false
  },
  { type: "error", name: "DealAlreadyExists", inputs: [] },
  { type: "error", name: "DealNotFound", inputs: [] },
  {
    type: "error",
    name: "DeliveryTimeoutNotReached",
    inputs: [
      { name: "releaseTime", type: "uint256", internalType: "uint256" },
      { name: "currentTimestamp", type: "uint256", internalType: "uint256" }
    ]
  },
  {
    type: "error",
    name: "ERC20TransferFailed",
    inputs: [
      { name: "token", type: "address", internalType: "address" },
      { name: "to", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" }
    ]
  },
  {
    type: "error",
    name: "InspectionPeriodExpired",
    inputs: [
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "currentTimestamp", type: "uint256", internalType: "uint256" }
    ]
  },
  {
    type: "error",
    name: "InspectionPeriodStillActive",
    inputs: [
      { name: "deadline", type: "uint256", internalType: "uint256" },
      { name: "currentTimestamp", type: "uint256", internalType: "uint256" }
    ]
  },
  {
    type: "error",
    name: "InvalidAmount",
    inputs: [
      { name: "expected", type: "uint256", internalType: "uint256" },
      { name: "actual", type: "uint256", internalType: "uint256" }
    ]
  },
  {
    type: "error",
    name: "InvalidDealState",
    inputs: [
      { name: "current", type: "uint8", internalType: "enum EscrowTypes.DealState" },
      { name: "required", type: "uint8", internalType: "enum EscrowTypes.DealState" }
    ]
  },
  {
    type: "error",
    name: "InvalidParticipant",
    inputs: [{ name: "caller", type: "address", internalType: "address" }]
  },
  {
    type: "error",
    name: "NativeTransferFailed",
    inputs: [
      { name: "recipient", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" }
    ]
  },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  {
    type: "error",
    name: "Unauthorized",
    inputs: [{ name: "caller", type: "address", internalType: "address" }]
  },
  { type: "error", name: "ZeroAddress", inputs: [] },
  { type: "error", name: "ZeroAmount", inputs: [] },
  { type: "error", name: "ZeroDuration", inputs: [] }
];

function resolveContractAddress() {
  if (process.env.DEPLOYED_ESCROW_ADDRESS) {
    return process.env.DEPLOYED_ESCROW_ADDRESS.trim();
  }

  if (fs.existsSync(BROADCAST_PATH)) {
    try {
      const broadcastData = JSON.parse(fs.readFileSync(BROADCAST_PATH, "utf8"));
      const tx = broadcastData.transactions.find(
        (t) => t.contractName === "DigitalEscrow" || t.transactionType === "CREATE"
      );
      if (tx) {
        return tx.contractAddress || (tx.receipt && tx.receipt.contractAddress);
      }
    } catch (e) {
      console.warn(`[Warning] Could not parse broadcast file: ${e.message}`);
    }
  }

  // Fallback to active Base Sepolia deployed contract
  return "0x165B47291B87569b91696DCE6f1207eE15C9f783";
}

function resolveAbi() {
  if (fs.existsSync(ARTIFACT_PATH)) {
    try {
      const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
      if (artifact.abi && Array.isArray(artifact.abi)) {
        return artifact.abi;
      }
    } catch (e) {
      console.warn(`[Warning] Failed to read artifact at ${ARTIFACT_PATH}, using canonical ABI.`);
    }
  }
  return CANONICAL_ABI;
}

function updateEnvFile(filePath, key, value) {
  let content = "";
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf8");
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}\n`;
    }
  } else {
    content = `${key}=${value}\n`;
  }
  fs.writeFileSync(filePath, content, "utf8");
}

function main() {
  const contractAddress = resolveContractAddress();
  const abi = resolveAbi();

  console.log(`[Pipeline] Synchronizing DigitalEscrow ABI`);
  console.log(`[Pipeline] Target Contract Address: ${contractAddress}`);
  console.log(`[Pipeline] ABI Elements Count:     ${abi.length}`);

  // 1. Validate required interface methods
  const requiredMethods = [
    "createDeal",
    "deposit",
    "startInspection",
    "settle",
    "raiseDispute",
    "resolveDispute",
    "cancelDepositedDeal",
    "getDeal"
  ];

  const presentMethods = abi
    .filter((item) => item.type === "function")
    .map((item) => item.name);

  for (const method of requiredMethods) {
    if (!presentMethods.includes(method)) {
      throw new Error(`Critical method missing from ABI: ${method}`);
    }
  }
  console.log(`[Pipeline] All ${requiredMethods.length} required external functions verified.`);

  // 2. Prepare file contents
  const jsonContent = JSON.stringify(
    {
      contractName: CONTRACT_NAME,
      chainId: 84532,
      network: "base-sepolia",
      address: contractAddress,
      abi: abi,
    },
    null,
    2
  );

  const tsContent = `// Auto-generated by export-artifacts.js - DO NOT EDIT DIRECTLY
export const DIGITAL_ESCROW_CHAIN_ID = 84532 as const;
export const DIGITAL_ESCROW_ADDRESS = "${contractAddress}" as const;

export const DIGITAL_ESCROW_ABI = ${JSON.stringify(abi, null, 2)} as const;

export type DigitalEscrowAbi = typeof DIGITAL_ESCROW_ABI;
export default DIGITAL_ESCROW_ABI;
`;

  const indexContent = `// Auto-generated by export-artifacts.js - DO NOT EDIT DIRECTLY
export * from "./${CONTRACT_NAME}ABI";
export { default as ${CONTRACT_NAME}JSON } from "./${CONTRACT_NAME}.json";
`;

  // 3. Write to each target application
  TARGET_PACKAGES.forEach((target) => {
    fs.mkdirSync(target.abiDir, { recursive: true });

    const jsonPath = path.join(target.abiDir, `${CONTRACT_NAME}.json`);
    const tsPath = path.join(target.abiDir, `${CONTRACT_NAME}ABI.ts`);
    const indexPath = path.join(target.abiDir, "index.ts");

    fs.writeFileSync(jsonPath, jsonContent, "utf8");
    fs.writeFileSync(tsPath, tsContent, "utf8");
    fs.writeFileSync(indexPath, indexContent, "utf8");

    // Update .env and .env.example
    updateEnvFile(target.envFile, target.envKey, contractAddress);
    updateEnvFile(target.envExample, target.envKey, contractAddress);

    console.log(`[Success] Synced -> ${path.relative(MONOREPO_ROOT, target.abiDir)}`);
    console.log(`[Success] Updated -> ${path.relative(MONOREPO_ROOT, target.envFile)} (${target.envKey})`);
  });

  console.log(`[Complete] Export and sync pipeline finished successfully.`);
}

main();
