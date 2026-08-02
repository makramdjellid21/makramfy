"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import {
  inviteMemberAction,
  removeMemberAction,
  changeMemberRoleAction,
} from "@/actions/organizations";
import { hasPermission, ROLE_LABELS } from "@/lib/permissions";
import type { Role } from "@/lib/permissions";
import { UserPlus, MoreVertical, Trash2, Shield, Crown } from "lucide-react";

interface Member {
  id: string;
  userId: string;
  role: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
  createdAt: Date;
}

interface MembersClientProps {
  orgId: string;
  orgSlug: string;
  members: Member[];
  currentUserId: string;
  myRole: string;
  plan: string;
  memberLimit: number | typeof Infinity;
  memberCount: number;
}

export function MembersClient({
  orgId,
  orgSlug,
  members,
  currentUserId,
  myRole,
  plan,
  memberLimit,
  memberCount,
}: MembersClientProps) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const canInvite = hasPermission(myRole as Role, "invite_member");
  const canRemove = hasPermission(myRole as Role, "remove_member");
  const canChangeRole = hasPermission(myRole as Role, "change_member_role");

  const atLimit = memberLimit !== Infinity && memberCount >= memberLimit;

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess("");

    const result = await inviteMemberAction(orgId, inviteEmail.trim(), inviteRole);
    setInviteLoading(false);

    if (!result.success) {
      setInviteError(result.error);
    } else {
      setInviteSuccess(`تم إرسال الدعوة إلى ${inviteEmail}`);
      setInviteEmail("");
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("هل أنت متأكد من إزالة هذا العضو؟")) return;
    setActionLoading(userId);
    setError("");

    const result = await removeMemberAction(orgId, userId);
    setActionLoading(null);
    if (!result.success) setError(result.error);
    setOpenMenuId(null);
  }

  async function handleRoleChange(userId: string, newRole: Role) {
    setActionLoading(userId);
    setError("");

    const result = await changeMemberRoleAction(orgId, userId, newRole);
    setActionLoading(null);
    if (!result.success) setError(result.error);
    setOpenMenuId(null);
  }

  const roleBadge: Record<string, { label: string; variant: "default" | "info" | "purple" }> = {
    OWNER: { label: "مالك", variant: "purple" },
    ADMIN: { label: "مشرف", variant: "info" },
    MEMBER: { label: "عضو", variant: "default" },
  };

  return (
    <div className="space-y-6">
      {error && <Alert type="error">{error}</Alert>}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الأعضاء</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {memberCount} من {memberLimit === Infinity ? "∞" : memberLimit} أعضاء
          </p>
        </div>
        {canInvite && (
          <Button
            onClick={() => setInviteOpen(true)}
            disabled={atLimit}
            title={atLimit ? "وصلت للحد الأقصى من الأعضاء" : ""}
          >
            <UserPlus size={16} />
            دعوة عضو
          </Button>
        )}
      </div>

      {atLimit && canInvite && (
        <Alert type="warning">
          وصلت إلى الحد الأقصى لعدد الأعضاء في خطة {plan}.{" "}
          <a href={`/dashboard/${orgSlug}/billing`} className="font-medium underline">
            ترقية الخطة
          </a>
        </Alert>
      )}

      {/* Members List */}
      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 shadow-sm">
        {members.map((member) => {
          const isMe = member.userId === currentUserId;
          const badge = roleBadge[member.role] ?? { label: member.role, variant: "default" };

          return (
            <div key={member.id} className="flex items-center gap-4 p-4">
              <Avatar name={member.name} imageUrl={member.imageUrl} size="md" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {member.name ?? "بدون اسم"}
                    {isMe && (
                      <span className="text-xs text-violet-500 mr-1">(أنت)</span>
                    )}
                  </p>
                </div>
                <p className="text-xs text-slate-500 truncate">{member.email}</p>
              </div>

              <Badge variant={badge.variant as "default" | "info" | "purple"}>
                {member.role === "OWNER" ? (
                  <span className="flex items-center gap-1">
                    <Crown size={10} />
                    {badge.label}
                  </span>
                ) : member.role === "ADMIN" ? (
                  <span className="flex items-center gap-1">
                    <Shield size={10} />
                    {badge.label}
                  </span>
                ) : (
                  badge.label
                )}
              </Badge>

              {/* Actions */}
              {!isMe && (canRemove || canChangeRole) && member.role !== "OWNER" && (
                <div className="relative">
                  <button
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                    onClick={() =>
                      setOpenMenuId(openMenuId === member.userId ? null : member.userId)
                    }
                    disabled={actionLoading === member.userId}
                  >
                    {actionLoading === member.userId ? (
                      <div className="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full" />
                    ) : (
                      <MoreVertical size={16} />
                    )}
                  </button>

                  {openMenuId === member.userId && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-10 min-w-40 py-1">
                      {canChangeRole && member.role !== "ADMIN" && (
                        <button
                          className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          onClick={() => handleRoleChange(member.userId, "ADMIN")}
                        >
                          <Shield size={14} className="text-blue-500" />
                          ترقية لمشرف
                        </button>
                      )}
                      {canChangeRole && member.role !== "MEMBER" && (
                        <button
                          className="w-full text-right px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => handleRoleChange(member.userId, "MEMBER")}
                        >
                          تخفيض لعضو
                        </button>
                      )}
                      {canRemove && (
                        <button
                          className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          onClick={() => handleRemove(member.userId)}
                        >
                          <Trash2 size={14} />
                          إزالة من المتجر
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteError("");
          setInviteSuccess("");
        }}
        title="دعوة عضو جديد"
      >
        <div className="space-y-4">
          {inviteError && <Alert type="error">{inviteError}</Alert>}
          {inviteSuccess && <Alert type="success">{inviteSuccess}</Alert>}

          <Input
            label="البريد الإلكتروني"
            type="email"
            placeholder="name@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            dir="ltr"
          />

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">الدور</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="MEMBER">عضو — وصول عادي للقراءة والاستخدام</option>
              <option value="ADMIN">مشرف — إدارة الأعضاء والإعدادات</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleInvite} loading={inviteLoading} className="flex-1">
              إرسال الدعوة
            </Button>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
