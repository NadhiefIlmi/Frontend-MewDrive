/**
 * MenuItem Component
 * Reusable menu item for dropdowns
 */

import { FileText } from "lucide-react";

interface MenuItemProps {
  Icon: typeof FileText;
  label: string;
  onClick: () => void;
}

export function MenuItem({ Icon, label, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-ui px-3 py-2 text-left text-sm font-semibold hover:bg-sun"
    >
      <Icon className="size-4" /> {label}
    </button>
  );
}

interface UserActionMenuItemProps {
  Icon: typeof FileText;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export function UserActionMenuItem({
  Icon,
  label,
  onClick,
  danger,
}: UserActionMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-ui px-3 py-2 text-left text-sm font-semibold hover:bg-sun ${
        danger ? "text-coral" : ""
      }`}
    >
      <Icon className="size-4" /> {label}
    </button>
  );
}
