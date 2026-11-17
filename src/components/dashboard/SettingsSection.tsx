/**
 * SettingsSection Component
 * Settings page — hanya Telegram Report (dark mode dihapus).
 */

import { TelegramSettings } from "@/components/settings/TelegramSettings";
import { useToast, ToastContainer } from "@/components/ui/Toast";

export function SettingsSection() {
  const { toasts, dismiss, success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const flash = (msg: string, type: "success" | "error" | "info" = "success") => {
    if (type === "error") toastError(msg);
    else if (type === "info") toastInfo(msg);
    else toastSuccess(msg);
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <TelegramSettings onFlash={flash} />
    </div>
  );
}
