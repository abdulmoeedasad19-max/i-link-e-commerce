import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/require-admin";
import { getStoreSettings } from "@/lib/admin/store-settings";
import StoreSettingsForm from "@/components/admin/settings/store-settings-form";

export const metadata: Metadata = {
  title: "Store Settings",
};

export default async function AdminSettingsPage() {
  await requireAdmin();

  const settings = await getStoreSettings();

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-navy">Store Settings</h1>
        <p className="mt-1 text-sm text-slate">
          Manage the store&rsquo;s public information and shipping cost. Prices are always in PKR.
        </p>
      </div>

      <div className="mt-6 max-w-2xl">
        <StoreSettingsForm
          settings={{
            storeName: settings.storeName,
            phone: settings.phone,
            email: settings.email,
            hours: settings.hours,
            shippingCost: settings.shippingCost.toNumber(),
            easypaisaAccountName: settings.easypaisaAccountName ?? "",
            easypaisaNumber: settings.easypaisaNumber ?? "",
            easypaisaQrCode: settings.easypaisaQrCode ?? "",
            easypaisaInstructions: settings.easypaisaInstructions ?? "",
          }}
        />
      </div>
    </div>
  );
}
