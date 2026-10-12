import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { User } from "@/types/dashboard";

export function EditUserDialog({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (patch: { name: string; email: string; role: "Admin" | "User"; status: "Active" | "Disabled" }) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<"Admin" | "User">(user.role);
  const [status, setStatus] = useState<"Active" | "Disabled">(user.status);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Load roles dari API
  useEffect(() => {
    api.getRoles().then((res) => {
      if (res.success && res.data) setRoles(res.data);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert("Nama dan email harus diisi");
      return;
    }
    setSubmitting(true);
    onSave({ name: name.trim(), email: email.trim(), role, status });
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
          <h2 className="font-display text-2xl font-bold">Edit User</h2>
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
              className="w-full rounded-ui border-2 border-ink bg-background px-4 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2"
            />
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
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
