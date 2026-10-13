/**
 * Route: /login
 * Description: Halaman login untuk akses MewDrive
 * Features:
 * - Email + Password authentication (no username)
 * - Password visibility toggle
 * - Demo credentials display
 * - No public registration (Admin creates accounts)
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import loginKucing from "@/assets/login_kucing.png";
import catLogo from "@/assets/cat.png";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate({ to: "/" });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Email dan password harus diisi");
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(email, password);

      if (result.success) {
        // Redirect to dashboard
        navigate({ to: "/" });
      } else {
        // Tampilkan pesan yang lebih jelas untuk rate limit
        if (result.errorCode === 'TOO_MANY_REQUESTS' || result.error?.includes('Terlalu banyak') || result.error?.includes('Too many')) {
          setError("Terlalu banyak percobaan login. Tunggu 15 menit lalu coba lagi. Email & password kamu tidak salah — ini bukan masalah kredensial.");
        } else {
          setError(result.error || "Login gagal");
        }
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left Side - Login Form */}
      <div className="flex w-full flex-col justify-center px-4 py-8 sm:px-6 sm:py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-2.5 font-display text-2xl font-bold sm:mb-8 sm:gap-3 sm:text-3xl">
            <img
              src={catLogo}
              alt="Cat Logo"
              className="size-9 rounded-ui border-2 border-ink object-cover shadow-brutal-sm sm:size-12"
            />
            MewDrive
          </div>

          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Welcome back!!!</h1>
            <p className="mt-1.5 font-medium text-muted-foreground sm:mt-2">
              Login ke akun MewDrive kamu
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-bold sm:mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@example.com"
                className="w-full rounded-ui border-2 border-ink bg-card px-4 py-2.5 font-semibold outline-none transition-colors focus:bg-lime/20 focus:ring-2 focus:ring-ink focus:ring-offset-2 sm:py-3"
                autoFocus
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-bold sm:mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-ui border-2 border-ink bg-card px-4 py-2.5 pr-12 font-semibold outline-none transition-colors focus:bg-lime/20 focus:ring-2 focus:ring-ink focus:ring-offset-2 sm:py-3"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-ui border-2 border-ink bg-coral p-3 text-sm font-semibold">
                {error}
              </div>
            )}

            {/* Login Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              <LogIn className="size-5" />
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>


        </div>
      </div>

      {/* Right Side - Illustration (desktop only) */}
      <div className="relative hidden w-1/2 overflow-hidden border-l-2 border-ink bg-lilac lg:block">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-16 text-center">
          <div className="relative z-10 max-w-lg">
            <h2 className="mt-6 font-display text-5xl font-bold leading-tight">
              Kelola dokumen dengan rapi & aman
            </h2>
            <p className="mt-6 text-lg font-medium">
              Simpan, cari, dan bagikan file dengan mudah dalam satu tempat
              yang terorganisir.
            </p>
          </div>

          {/* Cat Image */}
          <div className="relative mt-12 h-64 w-full max-w-md overflow-hidden rounded-ui border-2 border-ink shadow-brutal">
            <img
              src={loginKucing}
              alt="Kucing lucu di workspace"
              className="absolute inset-0 size-full object-cover object-center"
            />
            <span className="absolute bottom-4 right-4 rounded-ui border-2 border-ink bg-sun px-4 py-2 text-sm font-bold shadow-brutal-sm">
              OFFICE CAT
            </span>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -bottom-20 -left-20 size-64 rounded-full border-2 border-ink bg-sun opacity-20" />
        <div className="absolute -right-20 -top-20 size-64 rounded-full border-2 border-ink bg-lime opacity-20" />
      </div>
    </div>
  );
}
