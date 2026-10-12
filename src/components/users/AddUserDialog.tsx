import { useState, useEffect } from "react";
import { X, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type NewUser = {
  name: string;
  email: string;
  password: string;
  role: "Admin" | "User";
  storageQuota: number;
  status: "Active" | "Disabled";
  initial: string;
  color: string;
  storageUsed: number;
};

const colors = ["bg-lime", "bg-lilac", "bg-sky", "bg-sun", "bg-coral"];

export function AddUserDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (user: NewUser) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Admin" | "User">("User");
  const [storageQuota, setStorageQuota] = useState(20);
  const [status, setStatus] = useState<"Active" | "Disabled">("Active");
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load roles dari API supaya select selalu sinkron dengan backend
  useEffect(() => {
    api.getRoles().then((res) => {
      if (res.success && res.data) {
        setRoles(res.data);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      alert("Semua field harus diisi");
      return;
    }

    const initial = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    setSubmitting(true);
    onAdd({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      storageQuota,
      status,
      initial,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      storageUsed: 0,
    });
    // parent handle API + tutup dialog
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-ui border-2 border-ink bg-card p-6 shadow-brutal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Add User</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-2 block text-sm font-bold">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Muhammad Nadhif"
              className="w-full rounded-ui border-2 border-ink bg-background px-4 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-bold">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nadhif@example.com"
              className="w-full rounded-ui border-2 border-ink bg-background px-4 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
            />
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-bold">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-ui border-2 border-ink bg-background px-4 py-2.5 pr-12 font-semibold outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>
          </div>

          {/* Role — dari API */}
          <div>
            <label className="mb-2 block text-sm font-bold">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "Admin" | "User")}
              className="w-full rounded-ui border-2 border-ink bg-background px-4 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
            >
              {roles.length > 0 ? (
                roles.map((r) => (
                  <option key={r.id} value={r.name === "ADMIN" ? "Admin" : "User"}>
                    {r.name === "ADMIN" ? "Admin" : "User"}
                  </option>
                ))
              ) : (
                <>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </>
              )}
            </select>
          </div>

          {/* Storage Quota */}
          <div>
            <label className="mb-2 block text-sm font-bold">Storage Quota (GB)</label>
            <input
              type="number"
              value={storageQuota}
              onChange={(e) => setStorageQuota(Number(e.target.value))}
              min="1"
              max="1000"
              className="w-full rounded-ui border-2 border-ink bg-background px-4 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
            />
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-bold">Status</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStatus("Active")}
                className={`flex-1 rounded-ui border-2 border-ink py-2.5 font-bold transition-colors ${
                  status === "Active" ? "bg-lime shadow-brutal-sm" : "bg-background hover:bg-lime/20"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatus("Disabled")}
                className={`flex-1 rounded-ui border-2 border-ink py-2.5 font-bold transition-colors ${
                  status === "Disabled" ? "bg-muted shadow-brutal-sm" : "bg-background hover:bg-muted/20"
                }`}
              >
                Disabled
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
