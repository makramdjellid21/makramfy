import {
  Home,
  Shirt,
  Smartphone,
  Baby,
  Sparkles,
  Dumbbell,
  BookOpen,
  Utensils,
  Watch,
  Car,
  Gift,
  Package,
  type LucideIcon,
} from "lucide-react";

const KEYWORD_ICONS: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ["منزل", "مطبخ", "بيت", "أثاث"], icon: Home },
  { keywords: ["ملابس", "أزياء", "لباس", "موضة"], icon: Shirt },
  { keywords: ["إلكترون", "الكترون", "موبايل", "هاتف", "تقنية"], icon: Smartphone },
  { keywords: ["أطفال", "طفل", "رضاعة"], icon: Baby },
  { keywords: ["جمال", "عناية", "تجميل", "مكياج", "عطور"], icon: Sparkles },
  { keywords: ["رياضة", "لياقة", "تمرين"], icon: Dumbbell },
  { keywords: ["كتب", "قرطاسية", "تعليم"], icon: BookOpen },
  { keywords: ["مطعم", "طعام", "أكل", "مأكولات"], icon: Utensils },
  { keywords: ["ساعات", "اكسسوارات", "إكسسوار"], icon: Watch },
  { keywords: ["سيارات", "سيارة", "قطع غيار"], icon: Car },
  { keywords: ["هدايا", "هدية"], icon: Gift },
];

export function getCategoryIcon(categoryName: string): LucideIcon {
  const normalized = categoryName.trim();
  for (const entry of KEYWORD_ICONS) {
    if (entry.keywords.some((k) => normalized.includes(k))) return entry.icon;
  }
  return Package;
}
