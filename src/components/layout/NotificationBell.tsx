"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Package, Users, Info, Check } from "lucide-react";
import {
  getNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/actions/notifications";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}

const ICONS: Record<string, typeof Package> = {
  order: Package,
  member: Users,
  system: Info,
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} ي`;
}

export function NotificationBell({ orgId }: { orgId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const result = await getNotificationsAction(orgId);
    if (result.success) setItems(result.data);
    setLoaded(true);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // تحديث كل 30 ثانية
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const unreadCount = items.filter((n) => !n.isRead).length;

  async function handleOpen() {
    setOpen(!open);
    if (!open) load();
  }

  async function handleItemClick(item: NotificationItem) {
    if (!item.isRead) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      markNotificationReadAction(orgId, item.id).catch(() => {});
    }
    setOpen(false);
  }

  async function handleMarkAll() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    await markAllNotificationsReadAction(orgId);
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative h-9 w-9 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
        aria-label="الإشعارات"
      >
        <Bell size={18} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-11 z-50 w-80 max-w-[90vw] bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">الإشعارات</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
                >
                  <Check size={12} />
                  تعليم الكل كمقروء
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {!loaded ? (
                <p className="text-center text-xs text-slate-400 py-8">جارٍ التحميل...</p>
              ) : items.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">ما فيه إشعارات بعد</p>
              ) : (
                items.map((item) => {
                  const Icon = ICONS[item.type] ?? Info;
                  const content = (
                    <div
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors ${
                        !item.isRead ? "bg-violet-50/50" : ""
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          !item.isRead ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                        {item.message && <p className="text-xs text-slate-500 mt-0.5 truncate">{item.message}</p>}
                        <p className="text-[10px] text-slate-400 mt-1">{timeAgo(item.createdAt)}</p>
                      </div>
                      {!item.isRead && <div className="h-2 w-2 rounded-full bg-violet-600 shrink-0 mt-1" />}
                    </div>
                  );

                  return item.link ? (
                    <Link key={item.id} href={item.link} onClick={() => handleItemClick(item)}>
                      {content}
                    </Link>
                  ) : (
                    <div key={item.id} onClick={() => handleItemClick(item)} className="cursor-pointer">
                      {content}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
