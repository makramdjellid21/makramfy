export type Role = "OWNER" | "ADMIN" | "MEMBER";

export type Permission =
  | "delete_organization"
  | "manage_billing"
  | "invite_member"
  | "remove_member"
  | "change_member_role"
  | "edit_settings"
  | "read_data"
  | "manage_products"
  | "delete_product"
  | "manage_categories"
  | "manage_orders"
  | "manage_store_settings";

const PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    "delete_organization",
    "manage_billing",
    "invite_member",
    "remove_member",
    "change_member_role",
    "edit_settings",
    "read_data",
    "manage_products",
    "delete_product",
    "manage_categories",
    "manage_orders",
    "manage_store_settings",
  ],
  ADMIN: [
    "invite_member",
    "remove_member",
    "change_member_role",
    "edit_settings",
    "read_data",
    "manage_products",
    "delete_product",
    "manage_categories",
    "manage_orders",
    "manage_store_settings",
  ],
  MEMBER: ["read_data", "manage_products", "manage_orders"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(role: Role, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`FORBIDDEN: Missing permission "${permission}"`);
  }
}

export const ROLE_LABELS: Record<Role, string> = {
  OWNER: "مالك",
  ADMIN: "مشرف",
  MEMBER: "عضو",
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}
