import type { Metadata } from "next";
import { redirect } from "next/navigation";
import SectionHeading from "@/components/ui/section-heading";
import ProfileForm from "@/components/sections/profile-form";
import ChangePasswordForm from "@/components/sections/change-password-form";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "My Profile",
  robots: { index: false, follow: true },
};

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <span className="text-sm font-semibold text-slate">{label}</span>
      <span className="text-sm font-bold text-navy">{value}</span>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account/profile");
  }

  // Scoped exclusively to the authenticated session's own id — never a
  // client-supplied id from the URL, a query param, or anywhere else.
  // `select` also means passwordHash is never even fetched from the
  // database here, not just withheld from the response.
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    // The session references a user no longer present in the database —
    // treat this the same as not being authenticated.
    redirect("/login?callbackUrl=/account/profile");
  }

  return (
    <div>
      <SectionHeading eyebrow="My Account" title="Profile" align="left" className="mx-0 text-left" />

      <div className="mt-8 rounded-2xl border border-light-gray bg-white premium-shadow">
        <div className="divide-y divide-light-gray border-b border-light-gray">
          <ProfileRow label="Email" value={user.email} />
          <ProfileRow label="Account Type" value={user.role === "ADMIN" ? "Administrator" : "Customer"} />
          <ProfileRow
            label="Member Since"
            value={user.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
        </div>

        <div className="p-5 sm:p-6">
          <ProfileForm initialName={user.name ?? ""} initialPhone={user.phone ?? ""} />
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-light-gray bg-white premium-shadow">
        <div className="border-b border-light-gray px-5 py-4 sm:px-6">
          <h2 className="text-base font-bold text-navy">Change Password</h2>
          <p className="mt-1 text-sm text-slate">Update the password used to sign in to your account.</p>
        </div>
        <div className="p-5 sm:p-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
