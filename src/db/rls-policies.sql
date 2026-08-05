-- ============================================================================
-- عزل بيانات التجار (Row-Level Security) — MakramFy
-- ============================================================================
-- يجب تشغيل هذا الملف يدويًا مرة واحدة على قاعدة البيانات (psql أو Neon SQL
-- Editor) بعد `npx drizzle-kit push`. drizzle-kit push لا يدير سياسات RLS،
-- فهذا الملف منفصل عن مخطط drizzle العادي.
--
-- الفكرة: كل جدول يحمل organization_id يُمنع الوصول لصفوفه إلا إذا كانت
-- الجلسة الحالية ضبطت app.current_org_id لنفس القيمة (عبر withOrgContext
-- بملف src/db/index.ts)، أو ضبطت app.bypass_rls = 'on' لعمليات موثوقة فقط
-- (لوحة أدمن المنصة / webhook مزوّد الدفع الموقّع).
--
-- ⚠️ FORCE ROW LEVEL SECURITY ضروري: بدونها، مالك الجدول (المستخدم اللي
-- أنشأ الجداول، وهو نفسه مستخدم DATABASE_URL عادةً) يتجاوز RLS تلقائيًا
-- ويصير التفعيل بلا أي أثر فعلي.
--
-- ⚠️ بعد تشغيل هذا الملف، أي استعلام يلمس هذه الجداول لازم يمر من
-- withOrgContext(...) أو withPlatformBypass(...) وإلا سيرجع صفوف فارغة
-- (Default-deny) — راجع القائمة بآخر الملف لمعرفة الأكشنز المحدَّثة فعلًا.
-- ============================================================================

-- ─── جداول عادية (organization_id NOT NULL) ────────────────────────────────
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['categories', 'products', 'customers', 'orders', 'store_settings']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', tbl);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I
         USING (organization_id = current_setting(''app.current_org_id'', true)
                OR current_setting(''app.bypass_rls'', true) = ''on'')
         WITH CHECK (organization_id = current_setting(''app.current_org_id'', true)
                OR current_setting(''app.bypass_rls'', true) = ''on'')',
      tbl
    );
  END LOOP;
END $$;

-- ─── جداول فرعية بدون organization_id مباشر (نتحقق عبر الجدول الأب) ───────
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON product_variants;
CREATE POLICY tenant_isolation ON product_variants
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
        AND p.organization_id = current_setting('app.current_org_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_variants.product_id
        AND p.organization_id = current_setting('app.current_org_id', true)
    )
  );

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON order_items;
CREATE POLICY tenant_isolation ON order_items
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.organization_id = current_setting('app.current_org_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.organization_id = current_setting('app.current_org_id', true)
    )
  );

-- ─── blocked_phones: حالة خاصة (organization_id يمكن أن يكون NULL = حظر منصة) ──
-- القراءة: يشوف التاجر أرقامه المحظورة + كل أرقام حظر المنصة (يحتاجها للعرض).
-- الكتابة (إضافة/تعديل/حذف): فقط ضمن متجره؛ صفوف المنصة (NULL) لا يلمسها إلا bypass.
ALTER TABLE blocked_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_phones FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_select ON blocked_phones;
DROP POLICY IF EXISTS tenant_isolation_insert ON blocked_phones;
DROP POLICY IF EXISTS tenant_isolation_update ON blocked_phones;
DROP POLICY IF EXISTS tenant_isolation_delete ON blocked_phones;

CREATE POLICY tenant_isolation_select ON blocked_phones FOR SELECT
  USING (
    organization_id = current_setting('app.current_org_id', true)
    OR organization_id IS NULL
    OR current_setting('app.bypass_rls', true) = 'on'
  );

CREATE POLICY tenant_isolation_insert ON blocked_phones FOR INSERT
  WITH CHECK (
    organization_id = current_setting('app.current_org_id', true)
    OR current_setting('app.bypass_rls', true) = 'on'
  );

CREATE POLICY tenant_isolation_update ON blocked_phones FOR UPDATE
  USING (
    organization_id = current_setting('app.current_org_id', true)
    OR current_setting('app.bypass_rls', true) = 'on'
  )
  WITH CHECK (
    organization_id = current_setting('app.current_org_id', true)
    OR current_setting('app.bypass_rls', true) = 'on'
  );

CREATE POLICY tenant_isolation_delete ON blocked_phones FOR DELETE
  USING (
    organization_id = current_setting('app.current_org_id', true)
    OR current_setting('app.bypass_rls', true) = 'on'
  );

-- ============================================================================
-- نطاق التفعيل الحالي (متعمّد): categories, products, product_variants,
-- customers, orders, order_items, store_settings, blocked_phones.
--
-- لم تُفعّل RLS على: notifications, memberships, invitations, subscriptions,
-- usage_records, login_attempts, checkout_attempts, organizations, users.
-- الأولى محمية أصلًا بفحص (userId + organizationId) معًا بمستوى التطبيق
-- (memberships/invitations)، أو بيانات فوترة/إشعارات أقل حساسية، أو جداول
-- rate-limiting مفتاحها IP وليس متجر أصلًا. يمكن توسيع النطاق لاحقًا بنفس
-- النمط بالضبط.
--
-- الأكشنز المحدَّثة لاستخدام withOrgContext/withPlatformBypass:
--   src/actions/categories.ts, products.ts, store-settings.ts,
--   src/actions/storefront.ts, orders.ts,
--   src/actions/organizations.ts (getDashboardData + إنشاء متجر جديد),
--   src/actions/admin.ts (كل الدوال التي تلمس orders/products/store_settings/
--   blocked_phones عبر withPlatformBypass),
--   src/app/api/webhooks/chargily/route.ts (withPlatformBypass)
-- ============================================================================
