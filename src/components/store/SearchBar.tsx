"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface SearchBarProps {
  themeColor: string;
  defaultValue?: string;
}

export function SearchBar({ themeColor, defaultValue = "" }: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/?search=${encodeURIComponent(trimmed)}` : "/");
  }

  return (
    <form onSubmit={handleSubmit} className="relative mb-8">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="ابحث عن منتج..."
        className="w-full pr-4 pl-12 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 bg-white"
        style={{ ["--tw-ring-color" as string]: themeColor }}
      />
      <button
        type="submit"
        className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: themeColor }}
      >
        <Search size={15} className="text-white" />
      </button>
    </form>
  );
}
