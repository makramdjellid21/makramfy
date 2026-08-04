"use client";

import { useState, useRef } from "react";
import { getCloudinarySignatureAction, recordUploadUsageAction } from "@/actions/cloudinary";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
  orgId?: string;
}

export function ImageUploader({
  value,
  onChange,
  folder = "makramfy",
  label = "رفع صورة",
  className,
  orgId,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("يرجى اختيار ملف صورة");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("حجم الصورة يجب أن لا يتجاوز 10MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const sigResult = await getCloudinarySignatureAction(folder, orgId, file.size);

      if (!sigResult.success) {
        setError(sigResult.error);
        return;
      }

      const { signature, timestamp, apiKey, cloudName } = sigResult.data;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", folder);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!response.ok) {
        throw new Error("فشل رفع الصورة");
      }

      const data = await response.json() as { secure_url: string };
      onChange(data.secure_url);

      if (orgId) {
        recordUploadUsageAction(orgId, file.size).catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <p className="text-sm font-medium text-slate-700">{label}</p>}

      {value ? (
        <div className="relative w-24 h-24 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="uploaded"
            className="w-24 h-24 rounded-xl object-cover border border-slate-200"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} className="text-slate-600" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
            "hover:border-violet-400 hover:bg-violet-50",
            uploading ? "border-violet-400 bg-violet-50" : "border-slate-200 bg-slate-50"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-600 border-t-transparent" />
              <p className="text-sm text-violet-600">جاري الرفع...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Upload size={24} />
              <p className="text-sm">اضغط أو اسحب الصورة هنا</p>
              <p className="text-xs">PNG, JPG, WEBP حتى 10MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={uploading}
      />

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
