import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SectionHeading from "@/components/ui/section-heading";
import AddressManager from "@/components/sections/address-manager";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Saved Addresses",
  robots: { index: false, follow: true },
};

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/addresses");
  }

  // Scoped exclusively to the authenticated session's own id — never a
  // client-supplied id from anywhere else.
  const addresses = await db.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      label: true,
      line1: true,
      line2: true,
      city: true,
      province: true,
      postalCode: true,
      phone: true,
      isDefault: true,
    },
  });

  return (
    <div>
      <SectionHeading eyebrow="My Account" title="Saved Addresses" align="left" className="mx-0 text-left" />

      <div className="mt-8">
        <AddressManager addresses={addresses.map((address) => ({ ...address, line2: address.line2 ?? "" }))} />
      </div>
    </div>
  );
}
