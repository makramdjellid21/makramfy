import { CreditCard, Wallet } from "lucide-react";

interface StoreFooterProps {
  storeName: string;
  showBranding: boolean;
}

export function StoreFooter({ storeName, showBranding }: StoreFooterProps) {
  return (
    <footer className="border-t border-slate-100 mt-10">
      <div className="max-w-5xl mx-auto px-4 py-8 text-center">
        <p className="text-xs text-slate-400 mb-3">
          © {new Date().getFullYear()} {storeName}. جميع الحقوق محفوظة.
        </p>
        <div className="flex items-center justify-center gap-3 text-slate-400 mb-4">
          <span className="flex items-center gap-1 text-xs bg-slate-50 px-2.5 py-1 rounded-lg">
            <CreditCard size={13} />
            EDAHABIA / CIB
          </span>
          <span className="flex items-center gap-1 text-xs bg-slate-50 px-2.5 py-1 rounded-lg">
            <Wallet size={13} />
            الدفع عند الاستلام
          </span>
        </div>
        {showBranding && (
          <p className="text-xs text-slate-400">
            متجر مبني عبر{" "}
            <a href="https://makramfy.com" className="font-semibold text-slate-600">
              MakramFy
            </a>
          </p>
        )}
      </div>
    </footer>
  );
}
