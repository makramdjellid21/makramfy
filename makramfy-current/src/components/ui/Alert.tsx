import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface AlertProps {
  type: "error" | "success" | "info" | "warning";
  title?: string;
  children: ReactNode;
  className?: string;
}

const config = {
  error: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-800",
    icon: AlertCircle,
    iconColor: "text-red-500",
  },
  success: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-800",
    icon: CheckCircle,
    iconColor: "text-emerald-500",
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    icon: Info,
    iconColor: "text-blue-500",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
};

export function Alert({ type, title, children, className }: AlertProps) {
  const { bg, text, icon: Icon, iconColor } = config[type];

  return (
    <div className={cn("flex gap-3 p-4 rounded-xl border", bg, className)}>
      <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", iconColor)} />
      <div className={cn("text-sm", text)}>
        {title && <p className="font-semibold mb-1">{title}</p>}
        {children}
      </div>
    </div>
  );
}
