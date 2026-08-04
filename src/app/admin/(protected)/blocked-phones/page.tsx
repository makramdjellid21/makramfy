import { getPlatformBlockedPhonesAction, getMultiReportedPhonesAction } from "@/actions/admin";
import { BlockedPhonesClient } from "./BlockedPhonesClient";

export default async function AdminBlockedPhonesPage() {
  const [blockedResult, suggestedResult] = await Promise.all([
    getPlatformBlockedPhonesAction(),
    getMultiReportedPhonesAction(),
  ]);

  const blocked = blockedResult.success ? blockedResult.data : [];
  const suggested = suggestedResult.success ? suggestedResult.data : [];

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">الحماية من الطلبات الوهمية</h1>
        <p className="text-sm text-slate-400 mt-1">
          أرقام محظورة على مستوى المنصة كلها — تُمنع تلقائيًا من إتمام أي طلب بأي متجر
        </p>
      </div>

      <BlockedPhonesClient initialBlocked={blocked} initialSuggested={suggested} />
    </div>
  );
}
