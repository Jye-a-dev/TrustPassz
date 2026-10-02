import * as jwt from 'jsonwebtoken';

export interface TestUserWallet {
  id: string;
  email: string;
  walletAddress: `0x${string}`;
  privateKey: `0x${string}`;
  displayName: string;
  role: 'USER' | 'ADMIN' | 'ARBITRATOR';
}

export const TEST_JWT_SECRET =
  process.env.JWT_SECRET || 'trustpassz_jwt_super_secret_key_2026';

export const SELLER_WALLET: TestUserWallet = {
  id: '11111111-1111-4111-a111-111111111111',
  email: 'seller@trustpassz.io',
  walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  privateKey:
    '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
  displayName: 'Trusted Seller Pro',
  role: 'USER',
};

export const BUYER_WALLET: TestUserWallet = {
  id: '22222222-2222-4222-a222-222222222222',
  email: 'buyer@trustpassz.io',
  walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
  privateKey:
    '0x5de4111afa1a4b94908f83103eb2f9547b7787f1681a201c6a01217e65873721',
  displayName: 'Verified Buyer Plus',
  role: 'USER',
};

export const ADMIN_WALLET: TestUserWallet = {
  id: '33333333-3333-4333-a333-333333333333',
  email: 'admin@trustpassz.io',
  walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  privateKey:
    '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a',
  displayName: 'Lead Admin Arbitrator',
  role: 'ADMIN',
};

export const ORACLE_RELAYER_ACCOUNT = {
  walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`,
  privateKey: (process.env.ORACLE_RELAYER_PRIVATE_KEY ||
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') as `0x${string}`,
};

/**
 * Generates signed JWT session Bearer token for test authenticated HTTP calls.
 */
export function generateTestAuthToken(
  user: TestUserWallet,
  secret: string = TEST_JWT_SECRET,
  expiresIn: string = '7d',
): string {
  const payload = {
    sub: user.id,
    id: user.id,
    email: user.email,
    walletAddress: user.walletAddress,
    wallet_address: user.walletAddress,
    displayName: user.displayName,
    role: user.role,
  };

  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}
