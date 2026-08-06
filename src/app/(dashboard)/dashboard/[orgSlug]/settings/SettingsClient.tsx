"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { ImageUploader } from "@/components/ImageUploader";
import { updateOrganizationAction, deleteOrganizationAction } from "@/actions/organizations";
import {
  updateStoreSettingsAction,
  toggleStorePublishedAction,
  testTelegramNotificationAction,
} from "@/actions/store-settings";
import { hasPermission } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { ExternalLink, Globe, Send, BarChart3, Megaphone, FileText, CreditCard, CheckCircle2 } from "lucide-react";

interface Org {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface Settings {
  isPublished: boolean;
  description: string | null;
  bannerUrl: string | null;
  themeColor: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  announcementText: string | null;
  socialInstagram: string | null;
  socialFacebook: string | null;
  socialTelegramChannel: string | null;
  socialWhatsapp: string | null;
  aboutText: string | null;
  returnPolicyText: string | null;
  privacyPolicyText: string | null;
  termsText: string | null;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  facebookPixelId: string | null;
  chargilySecretKey: string | null;
}

interface SettingsClientProps {
  orgId: string;
  org: Org;
  settings: Settings | null;
  myRole: string;
  storeUrl: string;
}

export function SettingsClient({ orgId, org, settings, myRole, storeUrl }: SettingsClientProps) {
  const router = useRouter();
  const canEdit = hasPermission(myRole as Role, "edit_settings");
  const canDelete = hasPermission(myRole as Role, "delete_organization");

  const [name, setName] = useState(org.name);
  const [logoUrl, setLogoUrl] = useState(org.logoUrl ?? "");

  const [description, setDescription] = useState(settings?.description ?? "");
  const [bannerUrl, setBannerUrl] = useState(settings?.bannerUrl ?? "");
  const [themeColor, setThemeColor] = useState(settings?.themeColor ?? "#16a34a");
  const [phone, setPhone] = useState(settings?.phone ?? "");
  const [email, setEmail] = useState(settings?.email ?? "");
  const [address, setAddress] = useState(settings?.address ?? "");
  const [announcementText, setAnnouncementText] = useState(settings?.announcementText ?? "");
  const [socialInstagram, setSocialInstagram] = useState(settings?.socialInstagram ?? "");
  const [socialFacebook, setSocialFacebook] = useState(settings?.socialFacebook ?? "");
  const [socialTelegramChannel, setSocialTelegramChannel] = useState(settings?.socialTelegramChannel ?? "");
  const [socialWhatsapp, setSocialWhatsapp] = useState(settings?.socialWhatsapp ?? "");
  const [aboutText, setAboutText] = useState(settings?.aboutText ?? "");
  const [returnPolicyText, setReturnPolicyText] = useState(settings?.returnPolicyText ?? "");
  const [privacyPolicyText, setPrivacyPolicyText] = useState(settings?.privacyPolicyText ?? "");
  const [termsText, setTermsText] = useState(settings?.termsText ?? "");
  const [telegramBotToken, setTelegramBotToken] = useState(settings?.telegramBotToken ?? "");
  const [telegramChatId, setTelegramChatId] = useState(settings?.telegramChatId ?? "");
  const [facebookPixelId, setFacebookPixelId] = useState(settings?.facebookPixelId ?? "");
  const [chargilySecretKey, setChargilySecretKey] = useState(settings?.chargilySecretKey ?? "");
  const [isPublished, setIsPublished] = useState(settings?.isPublished ?? false);

  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const searchParams = useSearchParams();
  const validTabIds = ["general", "appearance", "promo", "legal", "marketing", "payment"];
  const tabFromUrl = searchParams.get("tab");
  const activeTab = tabFromUrl && validTabIds.includes(tabFromUrl) ? tabFromUrl : "general";

  // كل حقول storeSettings تُحفظ مع بعض دائمًا (نفس الصف بقاعدة البيانات)، بغض النظر عن أي زر ضُغط
  function buildFormData() {
    const formData = new FormData();
    formData.set("description", description.trim());
    formData.set("bannerUrl", bannerUrl);
    formData.set("themeColor", themeColor);
    formData.set("phone", phone.trim());
    formData.set("email", email.trim());
    formData.set("address", address.trim());
    formData.set("announcementText", announcementText.trim());
    formData.set("socialInstagram", socialInstagram.trim());
    formData.set("socialFacebook", socialFacebook.trim());
    formData.set("socialTelegramChannel", socialTelegramChannel.trim());
    formData.set("socialWhatsapp", socialWhatsapp.trim());
    formData.set("aboutText", aboutText.trim());
    formData.set("returnPolicyText", returnPolicyText.trim());
    formData.set("privacyPolicyText", privacyPolicyText.trim());
    formData.set("termsText", termsText.trim());
    formData.set("telegramBotToken", telegramBotToken.trim());
    formData.set("telegramChatId", telegramChatId.trim());
    formData.set("facebookPixelId", facebookPixelId.trim());
    formData.set("chargilySecretKey", chargilySecretKey.trim());
    return formData;
  }

  async function handleSaveSection(section: string, successMsg: string) {
    setSavingSection(section);
    setError("");
    setSuccess("");
    const result = await updateStoreSettingsAction(orgId, buildFormData());
    setSavingSection(null);
    if (!result.success) setError(result.error);
    else setSuccess(successMsg);
  }

  async function handleSaveGeneral() {
    setSavingGeneral(true);
    setError("");
    setSuccess("");
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("logoUrl", logoUrl);
    const result = await updateOrganizationAction(orgId, formData);
    setSavingGeneral(false);
    if (!result.success) setError(result.error);
    else setSuccess("تم حفظ المعلومات العامة");
  }

  async function handleTestTelegram() {
    if (!telegramBotToken.trim() || !telegramChatId.trim()) {
      setError("أدخل Bot Token وChat ID أول");
      return;
    }
    setTestingTelegram(true);
    setError("");
    setSuccess("");
    const result = await testTelegramNotificationAction(orgId, telegramBotToken.trim(), telegramChatId.trim());
    setTestingTelegram(false);
    if (!result.success) setError(result.error);
    else setSuccess("تم إرسال رسالة تجريبية! تحقق من Telegram");
  }

  async function handleTogglePublish() {
    setPublishing(true);
    setError("");
    const result = await toggleStorePublishedAction(orgId, !isPublished);
    setPublishing(false);
    if (!result.success) setError(result.error);
    else setIsPublished(!isPublished);
  }

  async function handleDelete() {
    if (!confirm(`هل أنت متأكد من حذف متجر "${org.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
    setDeleting(true);
    const result = await deleteOrganizationAction(orgId);
    setDeleting(false);
    if (!result.success) setError(result.error);
    else router.push("/dashboard");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">الإعدادات</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {{
            general: "المعلومات العامة ورابط المتجر",
            appearance: "المظهر وبيانات التواصل",
            promo: "الإعلان الترويجي والتواصل الاجتماعي",
            legal: "الصفحات القانونية",
            marketing: "التسويق والتكاملات",
          }[activeTab] ?? "إدارة معلومات ونشر متجرك"}
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* رابط المتجر + النشر */}
      {activeTab === "general" && (
      <>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">رابط المتجر</h2>
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3">
          <Globe size={16} className="text-slate-400 shrink-0" />
          <span className="text-sm text-slate-700 truncate" dir="ltr">
            {storeUrl}
          </span>
          <a
            href={`http://${storeUrl}`}
            target="_blank"
            rel="noreferrer"
            className="mr-auto text-emerald-600 hover:text-emerald-700"
          >
            <ExternalLink size={16} />
          </a>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-800">
              {isPublished ? "المتجر منشور" : "المتجر غير منشور"}
            </p>
            <p className="text-xs text-slate-500">
              {isPublished ? "الزبائن يقدرون يشوفوا متجرك حاليًا" : "فعّل النشر عشان الزبائن يشوفوا متجرك"}
            </p>
          </div>
          {canEdit && (
            <Button
              variant={isPublished ? "outline" : "primary"}
              size="sm"
              onClick={handleTogglePublish}
              loading={publishing}
            >
              {isPublished ? "إلغاء النشر" : "نشر المتجر"}
            </Button>
          )}
        </div>
      </div>

      {/* المعلومات العامة */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">المعلومات العامة</h2>
        <Input label="اسم المتجر" value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
        <ImageUploader value={logoUrl} onChange={setLogoUrl} folder="makramfy/logos" label="شعار المتجر" orgId={orgId} />
        {canEdit && (
          <Button onClick={handleSaveGeneral} loading={savingGeneral}>
            حفظ
          </Button>
        )}
      </div>
      </>
      )}

      {/* إعدادات المتجر (Theme) */}
      {activeTab === "appearance" && (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">تخصيص المتجر</h2>

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">وصف المتجر</label>
          <textarea
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            rows={3}
            placeholder="وصف مختصر يظهر بالصفحة الرئيسية لمتجرك"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
          />
        </div>

        <ImageUploader value={bannerUrl} onChange={setBannerUrl} folder="makramfy/banners" label="صورة بانر المتجر" orgId={orgId} />

        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">لون المتجر الأساسي</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              disabled={!canEdit}
              className="h-10 w-14 rounded-lg border border-slate-200 cursor-pointer"
            />
            <span className="text-sm text-slate-500" dir="ltr">
              {themeColor}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="رقم الهاتف" placeholder="0555 xx xx xx" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canEdit} dir="ltr" />
          <Input label="البريد الإلكتروني" placeholder="contact@store.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canEdit} dir="ltr" />
        </div>
        <Input label="العنوان" placeholder="المدينة، الولاية" value={address} onChange={(e) => setAddress(e.target.value)} disabled={!canEdit} />

        {canEdit && (
          <Button onClick={() => handleSaveSection("store", "تم حفظ إعدادات المتجر")} loading={savingSection === "store"}>
            حفظ إعدادات المتجر
          </Button>
        )}
      </div>
      )}

      {/* الإعلان الترويجي */}
      {activeTab === "promo" && (
      <>
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone size={18} className="text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-900">الإعلان الترويجي</h2>
        </div>
        <p className="text-xs text-slate-500">
          شريط قصير يظهر بأعلى متجرك لكل الزبائن، مثال: &quot;شحن مجاني فوق 3000 د.ج&quot;
        </p>
        <Input
          placeholder="شحن مجاني لجميع الطلبات فوق 3000 د.ج"
          value={announcementText}
          onChange={(e) => setAnnouncementText(e.target.value)}
          disabled={!canEdit}
        />
        {canEdit && (
          <Button onClick={() => handleSaveSection("announcement", "تم حفظ الإعلان")} loading={savingSection === "announcement"}>
            حفظ
          </Button>
        )}
      </div>

      {/* روابط التواصل الاجتماعي */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">روابط التواصل الاجتماعي</h2>
        <p className="text-xs text-slate-500">تظهر كأيقونات بالقائمة الجانبية لمتجرك — اختياري</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="رقم واتساب"
            placeholder="0555xxxxxx"
            value={socialWhatsapp}
            onChange={(e) => setSocialWhatsapp(e.target.value)}
            disabled={!canEdit}
            dir="ltr"
          />
          <Input
            label="رابط قناة تيليجرام"
            placeholder="https://t.me/yourstore"
            value={socialTelegramChannel}
            onChange={(e) => setSocialTelegramChannel(e.target.value)}
            disabled={!canEdit}
            dir="ltr"
          />
          <Input
            label="رابط إنستغرام"
            placeholder="https://instagram.com/yourstore"
            value={socialInstagram}
            onChange={(e) => setSocialInstagram(e.target.value)}
            disabled={!canEdit}
            dir="ltr"
          />
          <Input
            label="رابط فيسبوك"
            placeholder="https://facebook.com/yourstore"
            value={socialFacebook}
            onChange={(e) => setSocialFacebook(e.target.value)}
            disabled={!canEdit}
            dir="ltr"
          />
        </div>

        {canEdit && (
          <Button onClick={() => handleSaveSection("social", "تم حفظ روابط التواصل")} loading={savingSection === "social"}>
            حفظ
          </Button>
        )}
      </div>
      </>
      )}

      {/* الصفحات القانونية */}
      {activeTab === "legal" && (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">الصفحات القانونية</h2>
        </div>
        <p className="text-xs text-slate-500">
          اختياري — إذا تركتها فاضية، متجرك بيعرض نص عام افتراضي بدلها
        </p>

        {[
          { label: "من نحن", value: aboutText, setValue: setAboutText },
          { label: "سياسة الإرجاع", value: returnPolicyText, setValue: setReturnPolicyText },
          { label: "سياسة الخصوصية", value: privacyPolicyText, setValue: setPrivacyPolicyText },
          { label: "شروط الاستخدام", value: termsText, setValue: setTermsText },
        ].map((field) => (
          <div key={field.label}>
            <label className="text-sm font-medium text-slate-700 block mb-1">{field.label}</label>
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              rows={3}
              value={field.value}
              onChange={(e) => field.setValue(e.target.value)}
              disabled={!canEdit}
            />
          </div>
        ))}

        {canEdit && (
          <Button onClick={() => handleSaveSection("legal", "تم حفظ الصفحات القانونية")} loading={savingSection === "legal"}>
            حفظ
          </Button>
        )}
      </div>
      )}

      {/* التسويق والتكاملات */}
      {activeTab === "marketing" && (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">التسويق والتكاملات</h2>
          <p className="text-xs text-slate-500 mt-0.5">اختياري — فعّلها إذا تبي</p>
        </div>

        <div className="space-y-3 pb-5 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-sky-500" />
            <p className="text-sm font-medium text-slate-800">إشعارات Telegram عند كل طلب</p>
          </div>
          <p className="text-xs text-slate-500">
            أنشئ بوت عبر{" "}
            <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="underline">
              @BotFather
            </a>{" "}
            وخذ الـ Token، وابدأ محادثة مع بوتك عشان تقدر تجيب Chat ID (مثلاً عبر{" "}
            <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="underline">
              @userinfobot
            </a>
            ).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Bot Token"
              placeholder="123456:ABC-DEF..."
              value={telegramBotToken}
              onChange={(e) => setTelegramBotToken(e.target.value)}
              disabled={!canEdit}
              dir="ltr"
            />
            <Input
              label="Chat ID"
              placeholder="123456789"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              disabled={!canEdit}
              dir="ltr"
            />
          </div>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={handleTestTelegram} loading={testingTelegram}>
              إرسال رسالة تجريبية
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-blue-600" />
            <p className="text-sm font-medium text-slate-800">Facebook Pixel</p>
          </div>
          <p className="text-xs text-slate-500">لتتبع زوار متجرك وتحسين إعلاناتك على فيسبوك وإنستغرام</p>
          <Input
            label="Pixel ID"
            placeholder="1234567890123456"
            value={facebookPixelId}
            onChange={(e) => setFacebookPixelId(e.target.value)}
            disabled={!canEdit}
            dir="ltr"
          />
        </div>

        {canEdit && (
          <Button onClick={() => handleSaveSection("marketing", "تم حفظ إعدادات التسويق")} loading={savingSection === "marketing"}>
            حفظ إعدادات التسويق
          </Button>
        )}
      </div>
      )}

      {/* الدفع الإلكتروني */}
      {activeTab === "payment" && (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard size={18} className="text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">الدفع الإلكتروني (Chargily Pay)</h2>
        </div>

        {chargilySecretKey ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl px-3 py-2.5">
            <CheckCircle2 size={14} />
            الدفع الأونلاين (EDAHABIA / CIB) مفعّل — أموال عملائك تصل مباشرة لحسابك أنت على Chargily
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl px-3 py-2.5 leading-relaxed">
            بدون هذا المفتاح، عملاؤك يقدرون يدفعوا فقط عند الاستلام. لتفعيل الدفع الأونلاين، أضف مفتاحك السري الخاص.
          </div>
        )}

        <p className="text-xs text-slate-500 leading-relaxed">
          أنشئ حساب مجاني على{" "}
          <a href="https://pay.chargily.com" target="_blank" rel="noreferrer" className="underline font-medium">
            Chargily Pay
          </a>{" "}
          (إن لم يكن لديك)، ثم من لوحته اذهب لـ <span className="font-medium">API Keys</span> وانسخ
          <span className="font-medium"> Secret Key</span> — هذا المفتاح خاص بحسابك أنت، وأموال عملائك تصل
          مباشرة له، وليس لأي طرف آخر.
        </p>

        <Input
          label="Chargily Secret Key"
          placeholder="test_sk_... أو live_sk_..."
          type="password"
          value={chargilySecretKey}
          onChange={(e) => setChargilySecretKey(e.target.value)}
          disabled={!canEdit}
          dir="ltr"
        />

        {canEdit && (
          <Button onClick={() => handleSaveSection("payment", "تم حفظ إعدادات الدفع")} loading={savingSection === "payment"}>
            حفظ
          </Button>
        )}
      </div>
      )}

      {/* منطقة الخطر */}
      {canDelete && activeTab === "general" && (
        <div className="bg-red-50 rounded-2xl border border-red-100 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-red-800">منطقة الخطر</h2>
          <p className="text-sm text-red-700">
            حذف المتجر يمسح كل المنتجات والطلبات والبيانات المرتبطة به نهائيًا.
          </p>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            حذف المتجر نهائيًا
          </Button>
        </div>
      )}
    </div>
  );
}
