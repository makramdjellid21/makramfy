/**
 * الشركات المعروفة اللي تعمل على بنية EcoTrack المشتركة (نفس الـ API بالضبط).
 * هذه القائمة للعرض فقط (شارة جميلة بلوحة التحكم) — لا نخمّن روابطها (base URL)
 * لأننا غير متأكدين 100% من subdomain كل شركة غير Anderson (مؤكدة من اختبار فعلي).
 * التاجر يبقى يلصق الرابط والتوكن الحقيقيين اللي أعطته شركته دائمًا.
 * المصدر: DZBuild (https://dzbuild.com/docs/couriers/ecotrack)
 */
export const ECOTRACK_COURIERS = [
  "Anderson Delivery",
  "DHD",
  "Conexlog",
  "MSM Go",
  "Rex Livraison",
  "RB Livraison",
  "Speed Delivery",
  "Areex",
  "Prest",
  "Rocket Delivery",
  "Worldexpress",
  "BaConsult",
  "Packers",
  "48hr Livraison",
  "MonoHub",
  "Golivri",
  "Coyote Express",
  "Salva Delivery",
  "Distazero",
  "Fretdirect",
  "TSL Express",
  "Negmar Express",
  "Ultra Express",
  "OM Express",
  "MedExpress",
  "Allo Livraison",
  "Assil Delivery",
  "Expedia Chrono",
  "HHD Express",
  "Imir",
  "Navex Delivery",
  "Swift Express",
  "Univer Delivery",
  "Colireli",
  "FZ Delivery",
  "Delivromail",
  "Pdex",
] as const;
