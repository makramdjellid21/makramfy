export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  processing: "قيد التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  canceled: "ملغي",
  refunded: "مسترجع",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار الدفع",
  paid: "مدفوع",
  failed: "فشل الدفع",
  refunded: "مسترجع",
};
