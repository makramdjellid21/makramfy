import { getAllStores } from "@/actions/admin";
import { StoresTable } from "./StoresTable";

export default async function AdminStoresPage() {
  const stores = await getAllStores();
  if (!stores) return null;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">المتاجر</h1>
        <p className="text-sm text-slate-400 mt-1">كل المتاجر المسجّلة بالمنصة ({stores.length})</p>
      </div>

      <StoresTable stores={stores} />
    </div>
  );
}
