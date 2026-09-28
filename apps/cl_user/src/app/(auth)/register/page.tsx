"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { GoogleLogin } from "@react-oauth/google";
import bs58 from "bs58";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { verifyAuthApi } from "@/lib/auth-api";
import { useAuthStore } from "@/lib/auth-store";

const registerSchema = z
  .object({
    name: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Địa chỉ email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Mật khẩu xác nhận phải có ít nhất 6 ký tự"),
    bindSolanaWallet: z.boolean(),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: "Bạn cần đồng ý với Quy chế Ký quỹ & Bảo mật Digital Vault",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { publicKey, signMessage, connected } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSolanaLoading, setIsSolanaLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"fast" | "custom">("fast");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      bindSolanaWallet: false,
      agreeTerms: true,
    },
  });

  const agreeTermsFast = React.useRef(true);
  const [agreeFastTerms, setAgreeFastTerms] = React.useState(true);

  // 1-Click Onboarding via Solana Wallet
  const handleSolanaRegister = async () => {
    if (!agreeFastTerms) {
      toast.warning("Vui lòng xác nhận đồng ý với Quy chế Ký quỹ!");
      return;
    }

    try {
      if (!connected || !publicKey) {
        setWalletModalVisible(true);
        return;
      }

      if (!signMessage) {
        toast.error("Ví của bạn không hỗ trợ tính năng ký SIWS!");
        return;
      }

      setIsSolanaLoading(true);

      const nonce =
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36) +
        crypto.getRandomValues(new Uint32Array(1))[0].toString(16);

      const messageText = `TrustPassz Authentication: Sign this message to verify ownership of your wallet. Nonce: ${nonce}`;
      const messageBytes = new TextEncoder().encode(messageText);

      toast.info("Xác nhận tạo tài khoản", {
        description: "Vui lòng phê duyệt ký tin nhắn khởi tạo tài khoản TrustPassz.",
      });

      const signatureBytes = await signMessage(messageBytes);
      const solanaSignature = bs58.encode(signatureBytes);
      const solanaPublicKey = publicKey.toBase58();

      const result = await verifyAuthApi({
        provider: "solana",
        solanaPublicKey,
        solanaSignature,
        solanaMessage: messageText,
        displayName: `Trader_${solanaPublicKey.slice(0, 4)}`,
      });

      setAuth(result.user);

      toast.success("Khởi tạo tài khoản Solana thành công!", {
        description: `Tài khoản ví ${solanaPublicKey.slice(0, 6)}... đã sẵn sàng tham gia kèo ký quỹ.`,
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : "Đăng ký Solana thất bại";
      toast.error("Không thể hoàn tất đăng ký", {
        description: errMessage.includes("User rejected")
          ? "Bạn đã từ chối yêu cầu ký trong ví."
          : errMessage,
      });
    } finally {
      setIsSolanaLoading(false);
    }
  };

  // 1-Click Onboarding via Google
  const handleGoogleRegister = async (credentialResponse: { credential?: string }) => {
    if (!agreeFastTerms) {
      toast.warning("Vui lòng xác nhận đồng ý với Quy chế Ký quỹ!");
      return;
    }

    if (!credentialResponse.credential) {
      toast.error("Không nhận được token từ Google");
      return;
    }

    try {
      toast.loading("Đang khởi tạo tài khoản Google...", { id: "google-register" });

      const result = await verifyAuthApi({
        provider: "google",
        token: credentialResponse.credential,
      });

      setAuth(result.user);

      toast.success("Đăng ký thành công!", {
        id: "google-register",
        description: `Chào mừng ${result.user.displayName || result.user.email} đến với TrustPassz`,
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : "Đăng ký thất bại";
      toast.error("Không thể khởi tạo tài khoản Google", {
        id: "google-register",
        description: errMessage,
      });
    }
  };

  // Custom Form Registration
  const onSubmitCustom = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      let solanaPublicKey: string | undefined = undefined;
      let solanaSignature: string | undefined = undefined;
      let solanaMessage: string | undefined = undefined;

      // Optional wallet binding
      if (data.bindSolanaWallet && connected && publicKey && signMessage) {
        const nonce = Math.random().toString(36).substring(2, 10);
        solanaMessage = `TrustPassz Link Wallet: ${nonce}`;
        const sig = await signMessage(new TextEncoder().encode(solanaMessage));
        solanaSignature = bs58.encode(sig);
        solanaPublicKey = publicKey.toBase58();
      }

      const result = await verifyAuthApi({
        email: data.email,
        password: data.password,
        displayName: data.name,
        walletAddress: solanaPublicKey,
      });

      setAuth(result.user);

      toast.success("Tạo tài khoản thành công!", {
        description: `Chào mừng ${data.name}, tài khoản đã sẵn sàng!`,
      });

      router.push("/dashboard");
    } catch (error: unknown) {
      const errMessage =
        error instanceof Error ? error.message : "Đăng ký tài khoản thất bại";
      toast.error("Lỗi đăng ký", { description: errMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#0B0F17] overflow-hidden">
      {/* Background Cyber Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 size-72 rounded-full bg-cyan-500/10 blur-[110px] pointer-events-none" />

      <Card className="relative w-full max-w-lg border border-slate-800 bg-slate-950/90 shadow-[0_0_35px_rgba(15,23,42,0.8)] backdrop-blur-xl">
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-cyan-500/40 bg-slate-900/95 px-3 py-1 text-[11px] font-semibold text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          >
            <ShieldCheck className="size-3.5 text-cyan-400" />
            <span>Đăng Ký Thành Viên Escrow</span>
          </Badge>
        </div>

        <CardHeader className="space-y-2 text-center pt-8">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            <span>Tạo Tài Khoản TrustPassz</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            Giao dịch sản phẩm số & mã nguồn an toàn với két ký quỹ tự động và trọng tài AI
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Fast Onboarding vs Standard Form Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab("fast")}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "fast"
                  ? "bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="size-3.5 text-cyan-400" />
              <span>1-Click Onboarding</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "custom"
                  ? "bg-slate-800 text-emerald-300 shadow-sm border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className="size-3.5 text-emerald-400" />
              <span>Email & Biểu Mẫu</span>
            </button>
          </div>

          {activeTab === "fast" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Wallet className="size-4 text-purple-400" />
                  <span>Đăng ký tức thì qua Ví Solana</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tự động cấp danh tính Web3 Escrow, không cần mật khẩu rườm rà.
                  Xác thực quyền sở hữu ví an toàn qua chữ ký Ed25519.
                </p>

                <Button
                  type="button"
                  onClick={handleSolanaRegister}
                  disabled={isSolanaLoading}
                  className="w-full bg-linear-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold h-11 rounded-lg border border-purple-400/30 shadow-[0_0_20px_rgba(99,102,241,0.25)] gap-2 text-xs sm:text-sm"
                >
                  {isSolanaLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-cyan-300" />
                      <span>Đang xác nhận chữ ký tạo tài khoản...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="size-4 text-cyan-200" />
                      <span>
                        {connected
                          ? "Ký xác thực đăng ký ví Solana"
                          : "Kết nối ví Solana để Đăng ký"}
                      </span>
                      <ArrowRight className="size-3.5 ml-auto text-cyan-200" />
                    </>
                  )}
                </Button>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span>Đăng ký 1 chạm bằng Google</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Liên kết hồ sơ Google, đồng bộ email nhận thông báo giao dịch và mã mở két Digital Vault.
                </p>

                <div className="w-full flex justify-center py-1">
                  <GoogleLogin
                    onSuccess={handleGoogleRegister}
                    onError={() => {
                      toast.error("Không thể kết nối dịch vụ Google OAuth");
                    }}
                    theme="filled_black"
                    shape="pill"
                    size="large"
                    text="signup_with"
                    width={360}
                  />
                </div>
              </div>

              {/* Terms Checkbox for 1-Click Onboarding */}
              <div className="flex items-start gap-2 pt-2">
                <input
                  id="agree-fast"
                  type="checkbox"
                  checked={agreeFastTerms}
                  onChange={(e) => setAgreeFastTerms(e.target.checked)}
                  className="mt-1 size-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
                />
                <label
                  htmlFor="agree-fast"
                  className="text-xs text-slate-400 select-none cursor-pointer leading-tight"
                >
                  Tôi đồng ý với{" "}
                  <span className="text-cyan-400 underline underline-offset-2">
                    Quy chế Ký quỹ & Bảo mật Digital Vault của TrustPassz
                  </span>
                  .
                </label>
              </div>
            </div>
          ) : (
            /* Custom Registration Form */
            <form onSubmit={handleSubmit(onSubmitCustom)} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-xs font-semibold text-slate-300"
                >
                  Họ và tên / Biệt danh Trader
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="pl-9 bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                    {...register("name")}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.name.message}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-slate-300"
                >
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="trader@trustpassz.io"
                    className="pl-9 bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="size-3" />
                    <span>{errors.email.message}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-slate-300"
                  >
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                      {...register("password")}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-rose-400">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-xs font-semibold text-slate-300"
                  >
                    Xác nhận
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9 bg-slate-900 border-slate-800 text-slate-200 focus:border-cyan-500 focus:ring-cyan-500/20"
                      {...register("confirmPassword")}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-400">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Optional Solana Wallet Association */}
              <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Wallet className="size-3.5 text-cyan-400" />
                    <span>Liên kết ví Solana ngay bây giờ</span>
                  </span>
                  {connected && publicKey ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 text-emerald-400 text-[10px]"
                    >
                      {publicKey.toBase58().slice(0, 4)}...
                      {publicKey.toBase58().slice(-4)}
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setWalletModalVisible(true)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 h-7 px-2"
                    >
                      Kết nối ví
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="bindSolanaWallet"
                    type="checkbox"
                    className="size-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
                    {...register("bindSolanaWallet")}
                  />
                  <label
                    htmlFor="bindSolanaWallet"
                    className="text-[11px] text-slate-400 select-none cursor-pointer"
                  >
                    Tự động gán ví Solana này vào tài khoản để nhận tiền ký quỹ
                  </label>
                </div>
              </div>

              {/* Mandatory Agreement Checkbox */}
              <div className="space-y-1">
                <div className="flex items-start gap-2 pt-1">
                  <input
                    id="agreeTerms"
                    type="checkbox"
                    className="mt-1 size-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
                    {...register("agreeTerms")}
                  />
                  <label
                    htmlFor="agreeTerms"
                    className="text-xs text-slate-400 select-none cursor-pointer leading-tight"
                  >
                    Tôi đồng ý với{" "}
                    <span className="text-cyan-400 underline underline-offset-2">
                      Quy chế Ký quỹ & Bảo mật Digital Vault của TrustPassz
                    </span>
                    .
                  </label>
                </div>
                {errors.agreeTerms && (
                  <p className="text-xs text-rose-400 flex items-center gap-1 pl-6">
                    <AlertCircle className="size-3" />
                    <span>{errors.agreeTerms.message}</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-linear-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold h-11 rounded-lg gap-2 mt-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-slate-950" />
                    <span>Đang khởi tạo tài khoản...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Ký Tài Khoản</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 border-t border-slate-800/80 pt-4">
          <p className="text-center text-xs text-slate-400">
            Đã có tài khoản TrustPassz?{" "}
            <Link
              href="/login"
              className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
