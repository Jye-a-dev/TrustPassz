export interface VerifyAuthPayload {
  token?: string;
  provider?: "google" | "privy" | "solana";
  solanaPublicKey?: string;
  solanaSignature?: string;
  solanaMessage?: string;
  walletAddress?: string;
  email?: string;
  password?: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string | null;
    walletAddress: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    role: string;
  };
}

export async function getNonceApi(): Promise<string> {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : "http://localhost:3000")
  ).replace(/\/$/, "");

  const res = await fetch(`${apiUrl}/api/v1/auth/nonce`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error("Không thể lấy chuỗi mã hóa Nonce từ máy chủ");
  }

  const data = await res.json();
  return data.nonce;
}

export async function verifyAuthApi(
  payload: VerifyAuthPayload
): Promise<AuthResponse> {
  const apiUrl = (
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3000`
      : "http://localhost:3000")
  ).replace(/\/$/, "");

  const res = await fetch(`${apiUrl}/api/v1/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.message ||
        `Xác thực thất bại (${res.status}: ${res.statusText})`
    );
  }

  return res.json();
}

